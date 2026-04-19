# Call Capture & Automation — Plan & Decisions

_Captured from discussion on 2026-04-18. Pick up from here when you return to this feature._

---

## The Goal

Log cellular phone calls to the dealer's business number inside the Vyavsay dashboard, next to the WhatsApp conversation timeline. When the dealer misses a call, auto-send a WhatsApp message to the caller so the lead doesn't go cold.

The dealer's one number (the SIM running WhatsApp via Baileys) is also the number customers dial. The goal is to keep that number unchanged.

---

## Two Visions Clarified

| Vision | Scope | What it needs |
|---|---|---|
| **A. Log every call (answered + missed)** | Full call log in dashboard, including ones the dealer picks up | Android companion app on dealer's phone (only path) |
| **B. Catch missed calls with AI + WhatsApp follow-up** | When dealer misses, Priya answers via Vapi and we WA the caller | Inbound Vapi flow + Indian phone number + SIM call-forward |

**Decision: Vision B first.** That's what the dealer actually asked for. Vision A is a later add-on if needed.

---

## Why Baileys Cannot See Cellular Calls

WhatsApp Web protocol is sandboxed from the device's cellular radio. Baileys only sees WhatsApp-native voice calls (`sock.ev.on('call')`), never PSTN. Meta's WhatsApp Business Calling API (GA July 2025) also only exposes WA-native calls. Confirmed across multiple sources.

**Implication:** the only way to see cellular calls is either the Android call log (Vision A) or routing them through a telephony provider (Vision B).

---

## Current Code State (verified 2026-04-18)

### Works ✅
- Vapi webhook is live at `/api/vapi/webhook` (`server.ts:64-65`)
- `handleAssistantRequest`, `handleStatusUpdate`, `handleEndOfCallReport`, `handleToolCalls` all implemented (`voice-service.ts`)
- `wb_calls` and `wb_call_actions` tables exist with inbound-aware schema
- Outbound flow works end-to-end (verified by manual test)

### Broken / Missing ❌
1. **`serverUrlSecret` is a placeholder** — `voice-service.ts:459` has `'choose_a_long_random_secret'` hardcoded. Replace with `config.VAPI_WEBHOOK_SECRET`.
2. **`getUserIdFromCall` multi-tenant bug** — `voice-service.ts:466-490` falls back to "first user in wb_users" when no metadata. Inbound calls never have metadata, so every dealer's inbound call would be attributed to whoever signed up first. Need `vapi_phone_number_id → user_id` lookup.
3. **No WhatsApp follow-up at end-of-call** — `handleEndOfCallReport` saves the call but never calls `baileysAdapter.sendMessage()`. This is the feature the dealer asked for. ~15 lines to add.
4. **Vapi dashboard webhook URL may not be set** — the manually-tested call did NOT write to `wb_calls` (DB is empty). Likely the Vapi assistant is configured via dashboard without pointing `server_url` at our backend. Fix in Vapi UI, not code.

---

## The Indian Number Problem

Vapi provisions numbers via Twilio/Vonage/Telnyx. All require Indian business KYC which Vapi does not handle for India. Self-serve Indian DIDs from Vapi = **not available**.

### Chosen solution: Plivo India → SIP trunk → Vapi (Bring Your Own Number)

```
Customer dials Indian number
  → Plivo DID answers
  → SIP trunk to Vapi
  → Priya answers (existing code)
  → Vapi webhooks → backend
  → wb_calls logged + WA follow-up
```

**Costs:**
- Plivo India DID: ~₹250/month
- Inbound: ~₹0.50-0.85/minute
- Vapi platform + GPT-4o + TTS: existing per-minute cost
- SIP trunk: free

**KYC:** GST + PAN + address proof (Girija Motors has these). 3-5 days approval.

**Dealer setup (MMI codes on their SIM):**
```
**61*<plivo-number>*11*20#   → forward-on-no-reply after 20s
**67*<plivo-number>#          → forward-on-busy
**62*<plivo-number>#          → forward-on-unreachable
```

When dealer misses → carrier forwards to Plivo → Plivo to Vapi → Priya answers.

### Alternative if Plivo KYC stuck: Exotel
- Indian-headquartered, better support for Indian proprietorships
- ~₹499/Exophone + bundled minutes
- Same SIP-to-Vapi architecture, or use Exotel's native "Flow" → webhook to our backend directly (skip Vapi)

### Rejected paths (and why)
- **Port SIM to VoIP** — breaks WhatsApp (WA requires real SIM). Dead end.
- **International forward from SIM to US Vapi number** — Indian carriers charge ISD rates or block it. Unreliable in production.
- **MyOperator / Knowlarity** — ₹1,999-2,500/month floors, too expensive for our per-client budget.
- **Twilio India direct** — heavy KYC, enterprise onboarding. Not self-serve.
- **Android companion app only** — covers Vision A but can't catch and auto-answer missed calls.

---

## Order of Operations

### Immediate (no blockers)
- [ ] Fix `serverUrlSecret` placeholder in `voice-service.ts:459`
- [ ] Wire WhatsApp follow-up in `handleEndOfCallReport` (~15 lines, calls `baileysAdapter.sendMessage` after save)
- [ ] In Vapi dashboard: set `Server URL` on the Priya assistant to `https://vyavsayassist.app/api/vapi/webhook`, enable events `status-update`, `end-of-call-report`, `tool-calls`
- [ ] Retest: call US Vapi number, confirm row appears in `wb_calls`

### Next (Plivo track)
- [ ] Sign up Plivo India as Girija Motors, submit KYC (GST/PAN/address)
- [ ] Wait 3-5 days for approval
- [ ] Purchase Indian DID
- [ ] Configure Plivo application: `<Dial><Sip>sip:<vapi-assistant>@sip.vapi.ai</Sip></Dial>`
- [ ] Vapi dashboard: add "BYO phone number" pointing at the Plivo number, assign Priya
- [ ] Dealer dials MMI forwarding codes on their SIM
- [ ] End-to-end test with a real customer call to the SIM

### Later (multi-tenant)
- [ ] Add `dealer_phone_numbers` table mapping `vapi_phone_number_id → user_id`
- [ ] Rewrite `getUserIdFromCall` to use this lookup, remove "first user" fallback
- [ ] Dealer onboarding UI: buy Plivo number + configure forward + assign to their account

### Optional (Vision A)
- [ ] Android companion app for logging answered calls too — see research findings below

---

## Research Summary (Agents ran 2026-04-18)

Four parallel research agents returned the following:

1. **Baileys + WhatsApp PSTN visibility: NO.** No signal, no event, no API. WA-native call events are detectable but buggy (`@lid` vs phone number issue in Baileys issues #2142, #2154).

2. **Android call log companion app: VIABLE WITH CAVEATS.** Callyzer Biz is a Play Store precedent for exactly this ("Call Management Tool" category). Play Store approval is case-by-case. Sideloaded APK is the safer launch path. Key Android gotchas: foreground service with `dataSync` type, battery exemption mandatory on Xiaomi/Vivo/Oppo ROMs. **September 2026 Android Developer Verification deadline** — India not in first wave but coming.

3. **Indian VoIP providers: Plivo ₹250/mo is cheapest.** Exotel is the best native-India fallback (~₹499/month + bundle). MyOperator/Knowlarity/Tata Kaleyra all too expensive or enterprise-only. TRAI/DLT regulations do not block inbound forwarding; DLT is only for outbound promotional.

4. **Competitor CRM analysis.** Every WhatsApp-first CRM in India (Interakt, WATI, AiSensy, Gallabox, DoubleTick) has ZERO native cellular call logging. Every telephony-first CRM (Exotel, MyOperator, CallHippo) requires the dealer to adopt a virtual number. Only LeadSquared (enterprise) bridges both via an Android tracker app. **Vyavsay doing "keep existing SIM + log calls + WA follow-up" would be genuinely differentiated in this market.**

---

## Key File References

- `backend/src/routes/vapi-routes.ts` — webhook + outbound call endpoint
- `backend/src/services/voice-service.ts` — tool handlers, assistant config, lifecycle
- `backend/src/services/baileys-adapter.ts` — WA send path used by call follow-up
- `backend/src/config/environment.ts:24-27` — Vapi env vars (prod values not in local .env)
- `wb_calls`, `wb_call_actions` — Supabase tables (inbound-aware schema already in place)

---

## Open Questions for Later

1. Which caller-ID should the customer see when the dealer's SIM forwards to Plivo? Plivo's default = Plivo number (some carriers show original caller, some don't). Verify on first test call.
2. Should answered calls also get logged? Would require the Android app (Vision A). Probably yes for v2.
3. Intent scoring + lead update from call transcript — the existing `analyzeMessage` pipeline takes text, so transcripts should plug in with minor adaptation. Not wired yet.
4. Cost per dealer per month at Plivo pricing: need to model at 50/100/200 inbound min/month to see if it fits the ₹500-2000 budget.
