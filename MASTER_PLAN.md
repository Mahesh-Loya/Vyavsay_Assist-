# MASTER PLAN — Vyavsay AI Agent Upgrade

**Goal:** Transform the AI agent from a generic 4/10 chatbot into an 8/10 specialized used car sales agent  
**Two workstreams:** Domain Layer (architecture) + AI Fine-tuning (prompt quality)  
**Strategy:** Phased execution with 360-degree review after each phase  

---

## Phase Overview

| Phase | Name | Workstream | Effort | Status |
|-------|------|------------|--------|--------|
| **1** | Foundation | Domain Layer | 1 day | [x] COMPLETE |
| **R1** | Review Phase 1 | Verification | — | [x] COMPLETE (3 agents, 2 issues fixed) |
| **2** | Integration | Domain Layer + Fine-tuning | 1.5 days | [x] COMPLETE |
| **R2** | Review Phase 2 | Verification | — | [x] COMPLETE (2 agents, all PASS) |
| **3** | Used Cars Domain | Fine-tuning | 1.5 days | [x] COMPLETE |
| **R3** | Review Phase 3 | Verification | — | [x] COMPLETE (3 agents, 1 fix applied, quality noted for iteration) |
| **4** | Advanced Features | Both | 1.5 days | [x] COMPLETE |
| **R4** | Review Phase 4 | Verification | — | [x] COMPLETE (2 agents, all PASS) |
| **5** | Search & Memory | Architecture | 1 day | [x] COMPLETE |
| **R5** | Final Review | Full system test | — | [x] COMPLETE (2 agents, 1 fix applied, all PASS) |

---

## PHASE 1: Foundation (Domain Layer Scaffolding)
> Create the domain layer structure without touching existing code. Zero-risk.

### Task 1.1: Create `backend/src/domains/types.ts`
- [ ] Define `BaseDomain` interface with all sub-interfaces
- [ ] Sub-types: `IntentDefinition`, `DomainPatterns`, `BilingualTemplate`, `NegotiationTemplateSet`, `LlmParams`, `OperationalLimits`, `FallbackMessages`
- [ ] Export all types
- **File:** `backend/src/domains/types.ts` (NEW)

### Task 1.2: Create `backend/src/domains/generic/index.ts`
- [ ] Extract ALL current hardcoded values from `pipeline-service.ts` and `ai-router.ts`
- [ ] 13 intents from ai-router.ts:70
- [ ] INVENTORY_INTENTS from pipeline-service.ts:11-17
- [ ] autoReplyIntents from pipeline-service.ts:322-325
- [ ] Regex patterns from pipeline-service.ts:19-22
- [ ] Full analysis prompt from ai-router.ts:47-130
- [ ] Full reply prompt from ai-router.ts:220-270
- [ ] Location templates from pipeline-service.ts:342-358
- [ ] Negotiation templates from pipeline-service.ts:712-774
- [ ] Photo templates from pipeline-service.ts:819-831
- [ ] Negotiation config (default 4%, cap 30%) from pipeline-service.ts:782-797
- [ ] Limits (50/20/3/0.75/20)
- [ ] Fallback messages
- [ ] Price formatters (lakh/crore)
- [ ] Export as `genericDomain: BaseDomain`
- **File:** `backend/src/domains/generic/index.ts` (NEW)

### Task 1.3: Create `backend/src/domains/domain-router.ts`
- [ ] Import generic domain
- [ ] Create `getDomain(industry?: string | null): BaseDomain`
- [ ] Alias map: empty/"general" → generic, "used_cars"/"car dealer"/"automobile" → used_cars
- [ ] Always fallback to generic
- **File:** `backend/src/domains/domain-router.ts` (NEW)

### Task 1.4: Create DB migration
- [ ] `004-domain-fields.sql`: Add `negotiation_round`, `buying_signal_score`, `funnel_stage` to `wb_conversations`
- **File:** `backend/database/migrations/004-domain-fields.sql` (NEW)

### Task 1.5: Build verification
- [ ] Run `cd backend && npm run build` — must pass with zero errors
- [ ] No existing code is modified in this phase

### Phase 1 Deliverables:
```
backend/src/domains/
├── types.ts              (NEW)
├── domain-router.ts      (NEW)
└── generic/
    └── index.ts          (NEW)
backend/database/migrations/
└── 004-domain-fields.sql (NEW)
```

---

## REVIEW R1: Phase 1 Verification
> Deploy 3 review agents in parallel:

| Agent | Focus | Pass Criteria |
|-------|-------|---------------|
| **Type Check Agent** | Run `npm run build`, verify zero TS errors | Clean compilation |
| **Interface Completeness Agent** | Read types.ts, verify every hardcoded value from pipeline-service.ts and ai-router.ts has a corresponding field in BaseDomain | 100% coverage |
| **Generic Domain Agent** | Compare generic/index.ts values against original hardcoded values line-by-line | Exact match for all 20+ values |

**Gate:** All 3 agents must pass before Phase 2 begins.

---

## PHASE 2: Integration (Wire Domain Layer Into Pipeline)
> Modify existing files to read from domain config instead of hardcoded values.

### Task 2.1: Modify `backend/src/services/ai-router.ts`
- [ ] Import `BaseDomain` type
- [ ] Add `domain?: BaseDomain` param to `analyzeMessage()` (line 35)
- [ ] Add `domain?: BaseDomain` param to `generateReply()` (line 170)
- [ ] Add `domain?: BaseDomain` param to `generateFollowUp()` (line 316)
- [ ] Replace hardcoded analysis prompt (lines 47-130) with `domain.analysisPrompt.buildSystemPrompt({...})`
- [ ] Replace hardcoded reply prompt (lines 220-270) with `domain.replyPrompt.buildSystemPrompt({...})`
- [ ] Replace price formatting (line 188) with `domain.formatInventoryPrice()`
- [ ] Replace history slice (line 277) with `domain.limits.historyLlmLimit`
- [ ] Add `...domain.llmParams.reply` to OpenAI create() call (lines 288-291)
- [ ] Replace fallback message (line 292) with `domain.fallbacks.aiFailure`
- **File:** `backend/src/services/ai-router.ts` (MODIFY)

### Task 2.2: Modify `backend/src/services/pipeline-service.ts`
- [ ] Import `getDomain` and `BaseDomain`
- [ ] Add `const domain = getDomain(user.industry)` after user fetch (~line 72)
- [ ] Replace `INVENTORY_INTENTS` usage with `domain.inventoryIntents`
- [ ] Replace regex constants usage with `domain.patterns.*`
- [ ] Replace `autoReplyIntents` (line 322) with `domain.autoReplyIntents`
- [ ] Replace confidence threshold default (line 331) with `domain.limits.confidenceThreshold`
- [ ] Replace history limit (line 128) with `domain.limits.historyLoadLimit`
- [ ] Replace location reply block (lines 342-358) with `domain.locationTemplates`
- [ ] Replace photo limits (line 421) with `domain.limits.maxPhotosPerRequest`
- [ ] Replace appointment service default (line 179) with `domain.defaultAppointmentService`
- [ ] Replace fallback message (line 473) with `domain.fallbacks.genericAcknowledgement`
- [ ] Replace discount default (line 789) with `domain.negotiationConfig.defaultDiscountPercent`
- [ ] Replace photo reply templates (lines 819-831) with `domain.photoTemplates`
- [ ] Pass `domain` to all modified method calls
- **File:** `backend/src/services/pipeline-service.ts` (MODIFY)

### Task 2.3: Add typing delay to `backend/src/services/baileys-adapter.ts`
- [ ] Before `sendMessage()`, call `socket.sendPresence(jid, 'composing')`
- [ ] Add proportional delay: `Math.min(3000, Math.max(500, text.length * 50))` ms
- [ ] Before reply, call `socket.sendPresence(jid, 'available')`
- **File:** `backend/src/services/baileys-adapter.ts` (MODIFY)
- **Fixes:** Agent Analysis item #10 (No Typing Indicators, 0→8)

### Task 2.4: Set LLM parameters in OpenAI calls
- [ ] `analyzeMessage`: `temperature: 0.3, max_tokens: 500`
- [ ] `generateReply`: `temperature: 0.7, max_tokens: 150, frequency_penalty: 0.5`
- [ ] `generateSummary`: `temperature: 0.3, max_tokens: 200`
- [ ] `generateFollowUp`: `temperature: 0.8, max_tokens: 100`
- **File:** `backend/src/services/ai-router.ts` (already modifying)
- **Fixes:** Agent Analysis item #7 (LLM Parameters Not Set, 0→8)

### Task 2.5: Build verification
- [ ] Run `cd backend && npm run build` — must pass

### Phase 2 Deliverables:
```
Modified: ai-router.ts, pipeline-service.ts, baileys-adapter.ts
Fixes: Typing delay (P0), LLM params (P0)
```

---

## REVIEW R2: Phase 2 Verification
> Deploy 4 review agents in parallel:

| Agent | Focus | Pass Criteria |
|-------|-------|---------------|
| **Build Agent** | Run `npm run build` | Zero TS errors |
| **Backward Compat Agent** | Read pipeline-service.ts — verify every `domain.xxx` has a fallback `\|\| <original_value>` or the generic domain provides the exact same value | No behavior change for generic users |
| **Integration Agent** | Trace the flow: processIncomingMessage → getDomain → domain passed to analyzeMessage → domain passed to generateReply. Verify the chain is complete | All 3 functions receive domain |
| **Typing Delay Agent** | Read baileys-adapter.ts sendMessage — verify sendPresence("composing") + delay + sendPresence("available") are in correct order | Correct sequence |

**Gate:** All 4 agents must pass before Phase 3 begins.

---

## PHASE 3: Used Cars Domain + Prompt Fine-tuning
> Create the specialized car domain and rewrite all prompts for quality.

### Task 3.1: Create `backend/src/domains/used-cars/index.ts`
- [ ] **23 intents** — 13 existing + 10 new (test_drive_request, financing_inquiry, trade_in_inquiry, warranty_inquiry, document_inquiry, insurance_inquiry, accident_history_inquiry, ownership_inquiry, competitor_comparison, urgency_signal)
- [ ] **Intent detection rules** — Hinglish examples for each intent in the analysis prompt
- [ ] **Entity extraction** — make, model, year, fuel_type, transmission, km_driven, ownership_count, color, body_type, registration_state
- [ ] **Named persona** — "Rahul, 8+ years selling cars" with detailed voice guidelines
- [ ] **Sales psychology in reply prompt** — Cialdini principles (anchoring, scarcity, social proof, commitment, reciprocity, loss aversion)
- [ ] **Objection handling in reply prompt** — "too expensive" → EMI reframe, "OLX cheaper" → differentiate, "thinking about it" → set follow-up, "family approval" → send summary, "high km" → reframe, "trust deficit" → inspection report
- [ ] **Anti-repetition rules** — car-specific (budget, car selected, photos sent, price discussed, test drive offered)
- [ ] **Trust signals in prompt** — inspection report, accident-free, service history, RC status, warranty
- [ ] **Financing knowledge** — EMI formula, bank partners, documents needed, approval timeline
- [ ] **Document process knowledge** — RC transfer, insurance, NOC, loan foreclosure
- [ ] **Few-shot examples** — 3 ideal Hinglish conversations (inquiry→booking, negotiation with EMI pivot, OLX objection handling)
- [ ] **4-round negotiation config** — hold firm → small concession → reveal floor → escalate
- [ ] **Negotiation templates** — Hinglish + English for each round
- [ ] **"Last price" special handler** regex + round-aware response
- [ ] **EMI calculator function** — `(price, tenure, rate) → monthly EMI`
- [ ] **Urgency/scarcity triggers** — tied to real inventory quantity
- [ ] **Buying signals** — weighted list (financing=0.8, test drive=0.9, ready_to_buy=1.0)
- [ ] **Sales funnel stages** — inquiry → qualification → test_drive → negotiation → booking → documentation → delivery
- [ ] **Funnel progression rules** — intent-to-stage mapping
- [ ] **Confidence thresholds per intent** — price_negotiation: 0.85, greeting: 0.5, etc.
- [ ] **LLM params** — temperature: 0.7, max_tokens: 150, frequency_penalty: 0.5
- [ ] **Default discount** — 8% (vs generic 4%)
- **File:** `backend/src/domains/used-cars/index.ts` (NEW)
- **Fixes:** Agent Analysis items #1 (Sales Psychology), #2 (Negotiation), #3 (Intents), #5 (Objections), #8 (Persona), #11 (Last Price), #13 (Confidence), #14 (Indian Market)

### Task 3.2: Register used-cars domain in router
- [ ] Import `usedCarsDomain` in `domain-router.ts`
- [ ] Add to registry with aliases: "used_cars", "used cars", "car dealer", "automobile", "automotive"
- **File:** `backend/src/domains/domain-router.ts` (MODIFY)

### Task 3.3: Update frontend industry dropdown
- [ ] Change industry text input to `<select>` dropdown in Settings.tsx
- [ ] Options: "General Business" (generic), "Used Car Dealer" (used_cars)
- [ ] Preserve existing save/load logic
- **File:** `frontend/src/pages/Settings.tsx` (MODIFY)

### Task 3.4: Build verification
- [ ] Run `cd backend && npm run build` — must pass
- [ ] Run `cd frontend && npm run build` — must pass

### Phase 3 Deliverables:
```
New: domains/used-cars/index.ts
Modified: domain-router.ts, Settings.tsx
Fixes: Sales Psychology (P0), Objections (P0), Intents (P1), Persona (P1), Few-shot (P1), Negotiation (P1), Last Price, Confidence, Indian Market
```

---

## REVIEW R3: Phase 3 Verification
> Deploy 5 review agents in parallel:

| Agent | Focus | Pass Criteria |
|-------|-------|---------------|
| **Build Agent** | Run `npm run build` for both backend and frontend | Zero errors |
| **Intent Coverage Agent** | Read used-cars/index.ts — verify all 23 intents exist with detection rules and Hinglish examples | 23 intents, each with description + example |
| **Prompt Quality Agent** | Read the used-cars reply prompt — verify it contains: named persona, sales psychology (all 6 Cialdini), objection handling (5+ objections), anti-repetition rules, trust signals, few-shot examples (3+), financing knowledge, document process | All 8 sections present |
| **Negotiation Agent** | Read negotiation config — verify 4 rounds exist, each with strategy + templates (hi + en), EMI calculator function works, floor protection logic (round 3 reveal) | 4 rounds, EMI calc, floor at round 3 |
| **Generic Regression Agent** | Verify genericDomain still matches original hardcoded values — no accidental changes to generic behavior | Exact match |

**Gate:** All 5 agents must pass before Phase 4 begins.

---

## PHASE 4: Stateful Negotiation + Lead Scoring + Human Handoff
> Advanced features that require both code logic and DB integration.

### Task 4.1: Implement stateful negotiation in pipeline-service.ts
- [ ] Read `conversation.negotiation_round` from DB at start
- [ ] On negotiation intent: increment round, save to DB
- [ ] Route to correct round strategy from `domain.negotiationConfig.rounds[round]`
- [ ] Round 1: Hold firm, add value
- [ ] Round 2: Small concession (3%), pivot to EMI
- [ ] Round 3: Reveal floor + urgency
- [ ] Round 4: Escalate to human (send "beyond my authority" message, flag for dealer)
- [ ] "Last price" detection: skip to round 3 if detected after round 1
- [ ] Reset negotiation_round when conversation topic changes or new product discussed
- **File:** `backend/src/services/pipeline-service.ts` (MODIFY)
- **Fixes:** Agent Analysis item #2 (Stateless Negotiation, 2.5→7)

### Task 4.2: Implement buying signal scoring
- [ ] Accumulate buying_signal_score per conversation based on `domain.buyingSignals`
- [ ] Each detected signal adds its weight (0.0-1.0)
- [ ] Save to `wb_conversations.buying_signal_score`
- [ ] When score crosses `domain.buyingSignals.closeThreshold` (0.7), inject close-mode prompt fragment
- [ ] Close mode changes: "suggest concrete next step", "ask for token/booking", "create urgency"
- **File:** `backend/src/services/pipeline-service.ts` (MODIFY)
- **Fixes:** Agent Analysis item #12 (Buying Signals, 0→7)

### Task 4.3: Implement sales funnel progression
- [ ] Read `conversation.funnel_stage` from DB
- [ ] On each analyzed message, check `domain.funnel.progressionRules`
- [ ] If intent matches a progression rule, advance the stage
- [ ] Update both `wb_conversations.funnel_stage` and `wb_leads.stage`
- [ ] Never regress (only move forward)
- **File:** `backend/src/services/pipeline-service.ts` (MODIFY)
- **Fixes:** Agent Analysis item #6 (Conversation Memory — stage progression, 1→6)

### Task 4.4: Implement human handoff triggers
- [ ] Escalate to human (pause auto-reply, notify dealer) when:
  - [ ] Negotiation reaches round 4
  - [ ] Customer explicitly asks for human ("manager se baat karao")
  - [ ] Complaint intent detected
  - [ ] Same objection repeated 3+ times
- [ ] Send "connecting you with our team" message
- [ ] Set `conversation.ai_paused = true`
- **File:** `backend/src/services/pipeline-service.ts` (MODIFY)
- **Fixes:** Agent Analysis item #15 (Human Handoff, 0→7)

### Task 4.5: Add sentiment field to analysis
- [ ] Extend `AnalysisResult` interface with `sentiment?: { polarity: number; emotion: string }`
- [ ] Add sentiment extraction instructions to analysis prompt (in used-cars domain)
- [ ] Use sentiment in lead scoring: excited + high_intent → boost score
- [ ] Use sentiment for escalation: frustrated (polarity < -0.5) + 2 consecutive → escalate
- **File:** `backend/src/services/ai-router.ts` (MODIFY), `used-cars/index.ts` (MODIFY)
- **Fixes:** Agent Analysis item #4 (Sentiment, 0→6)

### Task 4.6: Build verification
- [ ] Run `cd backend && npm run build`
- [ ] Run migration 004 on Supabase

### Phase 4 Deliverables:
```
Modified: pipeline-service.ts (stateful negotiation, buying signals, funnel, handoff), ai-router.ts (sentiment), used-cars/index.ts (sentiment prompt)
Migration: 004-domain-fields.sql applied
Fixes: Negotiation (P1), Sentiment (P1), Buying Signals (P3), Funnel (P2), Handoff (P2)
```

---

## REVIEW R4: Phase 4 Verification
> Deploy 5 review agents in parallel:

| Agent | Focus | Pass Criteria |
|-------|-------|---------------|
| **Build Agent** | `npm run build` | Zero errors |
| **Negotiation Flow Agent** | Trace: negotiation intent → read round → route to strategy → increment round → save to DB. Verify rounds 1-4 each produce different responses | 4 distinct behaviors |
| **Buying Signal Agent** | Verify: signal weights defined, score accumulates, close-mode triggers at threshold, close prompt injected into generateReply | Full chain works |
| **Funnel Agent** | Verify: progression rules exist, stages advance correctly, wb_leads.stage AND wb_conversations.funnel_stage both update, no regression | Forward-only progression |
| **Handoff Agent** | Verify: 4 escalation triggers implemented, ai_paused set to true, "connecting you" message sent, dealer notified | All 4 triggers work |

**Gate:** All 5 agents must pass before Phase 5 begins.

---

## PHASE 5: Search Quality + Memory Enhancement
> Fix the RAG system and improve conversation memory.

### Task 5.1: Fix hybrid search (parallel, not waterfall)
- [ ] In `catalog-service.ts`, change `searchWithAlternatives()`:
  - Run structured search AND semantic search in parallel (`Promise.all`)
  - Merge results, deduplicate by item ID
  - Rank by: structured match first, then semantic similarity
- [ ] Enrich `generateDescription()` — produce natural language sentences, not comma lists
  - Before: "Honda City, sedan, fuel type: petrol, priced at 9.5 lakhs"
  - After: "2022 Honda City, a white petrol sedan with automatic transmission, single owner, 15000 km driven, priced at 9.5 lakhs, ideal for city commuting"
- **File:** `backend/src/services/catalog-service.ts` (MODIFY)
- **Fixes:** Agent Analysis item #9 (Hybrid Search, 5→8)

### Task 5.2: Enhance conversation memory
- [ ] In `buildConversationMemory()`, add structured tracking:
  - [ ] Products discussed: `{name, status: 'shown'|'liked'|'rejected'|'negotiating'}`
  - [ ] Customer preferences: extracted from conversation (fuel, transmission, budget, color)
  - [ ] Objections raised: tracked with count
  - [ ] Questions asked by AI: tracked with answer status
- [ ] Store as structured JSON in conversation memory, not just regex-matched strings
- **File:** `backend/src/services/pipeline-service.ts` (MODIFY)
- **Fixes:** Agent Analysis item #6 (Conversation Memory, 2→6)

### Task 5.3: Build verification
- [ ] Run `cd backend && npm run build`

### Phase 5 Deliverables:
```
Modified: catalog-service.ts (parallel search, rich descriptions), pipeline-service.ts (enhanced memory)
Fixes: Hybrid Search (P2), Product Descriptions (P2), Conversation Memory (P2)
```

---

## REVIEW R5: Final System Review
> Deploy 6 review agents for comprehensive 360-degree verification:

| Agent | Focus | Pass Criteria |
|-------|-------|---------------|
| **Full Build Agent** | `npm run build` for backend AND frontend | Zero errors everywhere |
| **Generic Regression Agent** | Test with industry=NULL user — verify IDENTICAL behavior to original codebase (same intents, same prompts, same negotiation) | No regression |
| **Used Cars E2E Agent** | Simulate full conversation: greeting → browse → specific inquiry → photo request → price ask → negotiation (4 rounds) → EMI pivot → test drive booking → document question. Verify each step uses domain config correctly | Full flow works |
| **Prompt Audit Agent** | Read ALL prompts in used-cars domain — verify: no AI giveaways (em dashes, passive voice), sales psychology present, Hinglish natural, few-shot examples present, objection handling complete | Quality standards met |
| **Data Flow Agent** | Trace: message → getDomain → analyzeMessage(domain) → intent detection → inventory/knowledge routing → generateReply(domain) → typing delay → send. Verify domain flows through entire chain | No breaks in chain |
| **Score Verification Agent** | Re-evaluate the system against original agent_analysis.md scorecard. Rate each of 10 components. Target: overall 7.5+/10 | Score improved from 4/10 to 7.5+/10 |

**Gate:** All 6 agents must pass. If Score Verification < 7.5, iterate on weak areas.

---

## Expected Score After All Phases

| Component | Before | After | Delta |
|-----------|--------|-------|-------|
| Prompt Engineering | 4.5 | 8 | +3.5 |
| Intent Detection | 3 | 7.5 | +4.5 |
| Negotiation System | 2.5 | 7.5 | +5 |
| Conversation Memory | 2 | 6 | +4 |
| RAG & Inventory Search | 5 | 7.5 | +2.5 |
| Anti-Repetition | 3 | 7 | +4 |
| Hinglish Support | 5 | 8 | +3 |
| Sales Psychology | 1 | 7.5 | +6.5 |
| WhatsApp UX | 4 | 7 | +3 |
| Lead Scoring | 3 | 7 | +4 |
| **Overall** | **4/10** | **7.5/10** | **+3.5** |

---

## File Change Summary

### New Files (6)
| File | Phase | Purpose |
|------|-------|---------|
| `backend/src/domains/types.ts` | 1 | BaseDomain interface |
| `backend/src/domains/domain-router.ts` | 1 | Industry → domain resolver |
| `backend/src/domains/generic/index.ts` | 1 | Current behavior as config |
| `backend/src/domains/used-cars/index.ts` | 3 | Car dealer specialization |
| `backend/database/migrations/004-domain-fields.sql` | 1 | Negotiation/funnel DB fields |
| `MASTER_PLAN.md` | — | This file (status tracker) |

### Modified Files (5)
| File | Phase | Changes |
|------|-------|---------|
| `backend/src/services/ai-router.ts` | 2, 4 | Domain param, LLM params, sentiment |
| `backend/src/services/pipeline-service.ts` | 2, 4, 5 | Domain integration, negotiation, signals, memory |
| `backend/src/services/baileys-adapter.ts` | 2 | Typing delay |
| `backend/src/services/catalog-service.ts` | 5 | Parallel search, rich descriptions |
| `frontend/src/pages/Settings.tsx` | 3 | Industry dropdown |

### Unchanged Files
```
session-manager.ts, rag-service.ts, rate-limiter.ts, reminder-service.ts,
all route files, validation.ts, environment.ts, all other frontend files
```

---

## Deployment After Each Phase

After each Review passes:
```bash
# Commit
git add -A && git commit -m "Phase X: <description>"
git push origin main

# Deploy
ssh -i "vyavsay.pem" ubuntu@51.20.19.169 "cd ~/Vyavsay_Baileys && git pull && docker compose down && docker compose up -d --build"
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Generic users break | Every `domain.xxx` has fallback to current hardcoded value |
| Used-cars prompts are bad | Few-shot examples + iterative testing with real WhatsApp messages |
| Build fails mid-integration | Phase 1-4 are separately committable; rollback = `git revert` |
| LLM responses change quality | Temperature/max_tokens tuned conservatively; can revert per-function |
| DB migration fails | Migration uses `IF NOT EXISTS`; safe to re-run |
