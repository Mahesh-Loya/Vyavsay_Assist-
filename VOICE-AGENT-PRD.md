# Voice Agent PRD — Vapi + Exotel Integration for Vyavsay Assist

> **Created:** April 10, 2026
> **Branch:** `feature/voice-agent`
> **Status:** Implementing
> **Dependencies:** Vapi account, Exotel trial account (optional for Indian number)

## Implementation Status Tracker

### Phase 1: Foundation (branch + migration + env config)
| # | Task | File | Status |
|---|------|------|--------|
| 1.1 | Create feature branch | git | [x] DONE |
| 1.2 | Create voice calls migration | backend/database/migrations/005-voice-calls.sql | [ ] TODO |
| 1.3 | Add VAPI env vars to config | backend/src/config/environment.ts | [ ] TODO |

### Phase 2: Backend Services & Routes
| # | Task | File | Status |
|---|------|------|--------|
| 2.1 | Create voice service | backend/src/services/voice-service.ts | [ ] TODO |
| 2.2 | Create Vapi webhook route | backend/src/routes/vapi-routes.ts | [ ] TODO |
| 2.3 | Register route in server.ts | backend/src/server.ts | [ ] TODO |
| 2.4 | Skip auth for /api/vapi | backend/src/plugins/auth-plugin.ts | [ ] TODO |

### Phase 3: Verify & Push
| # | Task | Status |
|---|------|--------|
| 3.1 | TypeScript compile check | [ ] TODO |
| 3.2 | Commit all changes | [ ] TODO |
| 3.3 | Push to remote (feature/voice-agent) | [ ] TODO |

---

## Table of Contents

1. [Goal](#1-goal)
2. [Architecture Overview](#2-architecture-overview)
3. [Infrastructure Setup — Vapi](#3-infrastructure-setup--vapi)
4. [Infrastructure Setup — Exotel (Indian Number)](#4-infrastructure-setup--exotel-indian-number)
5. [Database Schema](#5-database-schema)
6. [Backend Implementation](#6-backend-implementation)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Tool Definitions](#8-tool-definitions)
9. [Vapi Assistant Configuration](#9-vapi-assistant-configuration)
10. [Environment Variables](#10-environment-variables)
11. [Deployment Steps](#11-deployment-steps)
12. [Testing Plan](#12-testing-plan)
13. [Cost Estimates](#13-cost-estimates)
14. [Post-Hackathon Roadmap](#14-post-hackathon-roadmap)

---

## 1. Goal

Add AI voice calling to Vyavsay Assist so that:
- A customer can **call a phone number** and talk to an AI sales assistant
- The AI can **search inventory**, **book appointments**, **share location via WhatsApp**, and **escalate to human**
- All calls are **logged with transcript, actions, summary, and outcome** in the dashboard
- The voice agent **reuses the existing backend pipeline** — no duplicate business logic

### What We're NOT Building
- No custom STT/TTS pipeline (Vapi handles this)
- No audio processing (Vapi handles this)
- No WebSocket bridges (Vapi handles this)
- No call state machine (Vapi handles this)

---

## 2. Architecture Overview

### Path A: US Number (Hackathon Quick Path)

```
Customer Phone (anywhere in world)
        │
        ▼
Vapi Platform (US Phone Number)
  ┌─────────────────────────────┐
  │  Transcriber (Deepgram)     │
  │  LLM (GPT-4o / GPT-4o-mini)│
  │  TTS (ElevenLabs / PlayHT)  │
  │  Turn-taking + Barge-in     │
  └──────────┬──────────────────┘
             │ POST webhooks (tool-calls, end-of-call-report)
             ▼
    Vyavsay Backend (Fastify)
    https://vyavsayassist.app/api/vapi/webhook
        │
        ├── search_inventory  → CatalogService (existing)
        ├── book_appointment  → Supabase wb_tasks (existing)
        ├── share_location    → BaileysAdapter WhatsApp send (existing)
        ├── escalate_to_human → Pause AI + notify owner (existing)
        │
        ▼
    Supabase DB
    (wb_calls, wb_call_events — NEW tables)
```

### Path B: Indian Number (Exotel + Vapi)

```
Indian Customer Phone (+91)
        │
        ▼
Exotel (Indian Telephony — +91 number)
        │ SIP Trunk
        ▼
Vapi Platform (receives via SIP)
  ┌─────────────────────────────┐
  │  Same AI pipeline as Path A  │
  └──────────┬──────────────────┘
             │ POST webhooks
             ▼
    Vyavsay Backend (same as Path A)
```

### Data Flow for a Single Call

```
1. Phone rings → Vapi answers
2. Vapi sends "status-update" (ringing → in-progress) → Backend logs to wb_calls
3. Customer speaks → Vapi transcribes → LLM processes
4. LLM decides to call a tool (e.g., search_inventory)
5. Vapi POSTs "tool-calls" to /api/vapi/webhook
6. Backend executes tool using existing services
7. Backend returns result → Vapi speaks it to customer
8. (Repeat steps 3-7 for duration of call)
9. Call ends → Vapi sends "end-of-call-report"
10. Backend saves transcript, summary, actions, recording URL to wb_calls
```

---

## 3. Infrastructure Setup — Vapi

### 3.1 Create Vapi Account
1. Sign up at https://vapi.ai
2. Go to Dashboard → API Keys → copy your Private Key
3. Add to server `.env` as `VAPI_API_KEY`

### 3.2 Buy a Phone Number
1. Dashboard → Phone Numbers → Buy Number
2. Select a US number (instant)
3. Note the number and phone number ID
4. Add to `.env` as `VAPI_PHONE_NUMBER_ID`

### 3.3 Create Assistant (via API — recommended for code-first approach)

Instead of dashboard UI, create the assistant programmatically so it's version-controlled:

```bash
curl -X POST https://api.vapi.ai/assistant \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @vapi-assistant-config.json
```

The config JSON is defined in [Section 9](#9-vapi-assistant-configuration).

### 3.4 Create Tools (via API)

Create each tool via Vapi API:

```bash
curl -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "function",
    "function": {
      "name": "search_inventory",
      "description": "Search available products in business inventory",
      "parameters": { ... }
    },
    "server": {
      "url": "https://vyavsayassist.app/api/vapi/webhook"
    }
  }'
```

Tool definitions are in [Section 8](#8-tool-definitions).

### 3.5 Assign Phone Number to Assistant

```bash
curl -X PATCH https://api.vapi.ai/phone-number/$VAPI_PHONE_NUMBER_ID \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "assistantId": "$VAPI_ASSISTANT_ID" }'
```

### 3.6 Set Server URL

In the Vapi dashboard or via API, set the account-level server URL:
```
https://vyavsayassist.app/api/vapi/webhook
```

This receives ALL events: status-update, tool-calls, end-of-call-report, transcript, etc.

---

## 4. Infrastructure Setup — Exotel (Indian Number)

> **This is optional.** Only needed if you want an Indian +91 number.
> For hackathon, US number from Vapi is sufficient.

### 4.1 Create Exotel Trial Account
1. Go to https://my.exotel.com/auth/register
2. Sign up (free trial, no credit card)
3. You get trial credits + a trial phone number
4. Go to Settings → API → note your API Key, API Token, Account SID, and Subdomain

### 4.2 Configure Exotel SIP Trunk

In Exotel dashboard:
1. Go to **App Bazaar** → **SIP Trunk** (or contact Exotel support to enable vSIP)
2. Create a new SIP trunk with these settings:
   - **Trunk Name:** `vyavsay-vapi`
   - **SIP URI destination:** Get this from Vapi (Dashboard → Phone Numbers → SIP → Copy SIP URI)
   - **Codec:** PCMU (G.711 μ-law)
   - **DTMF:** RFC 2833

### 4.3 Configure Vapi to Accept Exotel SIP

In Vapi dashboard:
1. Go to **Phone Numbers** → **Import** → **SIP**
2. Add SIP trunk credentials:
   - **SIP URI:** Your Exotel SIP endpoint
   - **Authentication:** Credentials from Exotel
3. Assign this SIP number to your assistant

### 4.4 Alternative: Use Exotel-Vapi-Connector

Exotel provides an official connector: https://github.com/exotel/Exotel-Vapi-Connector

This is a Node.js middleware that:
- Receives calls from Exotel via webhook
- Bridges them to Vapi via SIP
- Handles call lifecycle events
- Supports inbound and outbound calls

**Deploy as a separate service or integrate into your Fastify backend.**

### 4.5 Test Call Flow

```
Your Indian phone → Calls Exotel +91 number
    → Exotel routes to SIP trunk
    → Vapi receives via SIP
    → AI agent answers
    → Tool calls hit your backend
    → Customer talks to AI on Indian number
```

---

## 5. Database Schema

### New Migration: `005-voice-calls.sql`

```sql
-- Voice call tracking
CREATE TABLE IF NOT EXISTS wb_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES wb_users(id),

  -- Vapi metadata
  vapi_call_id VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'vapi',

  -- Call details
  direction VARCHAR(10) NOT NULL DEFAULT 'inbound', -- inbound | outbound
  from_number VARCHAR(20),
  to_number VARCHAR(20),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),

  -- Status and timing
  status VARCHAR(20) DEFAULT 'ringing', -- ringing | in-progress | ended | failed
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_sec INTEGER,

  -- AI outputs
  transcript TEXT,
  summary TEXT,
  outcome VARCHAR(50), -- resolved | appointment_booked | escalated | dropped | voicemail
  sentiment VARCHAR(20), -- positive | neutral | negative

  -- Recording
  recording_url TEXT,

  -- Link to conversation (if customer has WhatsApp chat too)
  conversation_id UUID REFERENCES wb_conversations(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actions taken during a call
CREATE TABLE IF NOT EXISTS wb_call_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES wb_calls(id) ON DELETE CASCADE,
  action_name VARCHAR(100) NOT NULL, -- search_inventory, book_appointment, share_location, escalate
  action_args JSONB,
  action_result JSONB,
  success BOOLEAN DEFAULT true,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wb_calls_user ON wb_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_calls_vapi ON wb_calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_wb_calls_customer ON wb_calls(customer_phone);
CREATE INDEX IF NOT EXISTS idx_wb_calls_status ON wb_calls(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wb_call_actions_call ON wb_call_actions(call_id);
```

### Why Only 2 Tables (Not 4 from Research Doc)

The research doc proposed 4 tables (calls, events, transcript_segments, actions). For hackathon:
- `wb_calls` stores the call + full transcript (Vapi provides this in end-of-call-report)
- `wb_call_actions` stores tool calls made during the call
- Transcript segments and event timeline are overkill for demo — Vapi dashboard has these

---

## 6. Backend Implementation

### 6.1 New Files to Create

```
backend/src/
├── routes/
│   └── vapi-routes.ts          # NEW — webhook handler for Vapi events
├── services/
│   └── voice-service.ts        # NEW — voice call business logic
```

### 6.2 `vapi-routes.ts` — Webhook Handler

This is the single endpoint that receives ALL Vapi events.

```typescript
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { VoiceService } from '../services/voice-service.js';

export const vapiRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const voiceService = new VoiceService(server.supabase);

  /**
   * POST /api/vapi/webhook
   * Receives all Vapi server events: tool-calls, status-update, end-of-call-report, etc.
   * NOTE: This route must NOT require auth — Vapi calls it directly.
   */
  server.post('/webhook', async (request, reply) => {
    const { message } = request.body as any;

    if (!message?.type) {
      return reply.status(400).send({ error: 'Invalid webhook payload' });
    }

    console.log(`📞 [Vapi] Event: ${message.type}`);

    try {
      switch (message.type) {
        // ── Tool Calls ──────────────────────────────────────
        case 'tool-calls': {
          const results = await voiceService.handleToolCalls(message);
          return reply.send({ results });
        }

        // ── Call Status Updates ──────────────────────────────
        case 'status-update': {
          await voiceService.handleStatusUpdate(message);
          return reply.status(200).send();
        }

        // ── End of Call Report ───────────────────────────────
        case 'end-of-call-report': {
          await voiceService.handleEndOfCallReport(message);
          return reply.status(200).send();
        }

        // ── Assistant Request (dynamic assistant) ────────────
        case 'assistant-request': {
          const assistant = await voiceService.handleAssistantRequest(message);
          return reply.send(assistant);
        }

        // ── Transcript (real-time) ───────────────────────────
        case 'transcript': {
          // Log but don't process — end-of-call-report has full transcript
          console.log(`  📝 [${message.role}]: ${message.transcript}`);
          return reply.status(200).send();
        }

        // ── Hang Notification ────────────────────────────────
        case 'hang': {
          console.warn(`  ⚠️ [Vapi] Agent hung — no response detected`);
          return reply.status(200).send();
        }

        default: {
          console.log(`  [Vapi] Unhandled event type: ${message.type}`);
          return reply.status(200).send();
        }
      }
    } catch (err: any) {
      console.error(`❌ [Vapi] Webhook error:`, err.message);
      // Return 200 to prevent Vapi from retrying
      return reply.status(200).send();
    }
  });
};
```

### 6.3 `voice-service.ts` — Business Logic

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { CatalogService } from './catalog-service.js';
import { RagService } from './rag-service.js';
import { baileysAdapter } from './baileys-adapter.js';
import { config } from '../config/environment.js';

export class VoiceService {
  private catalog: CatalogService;
  private rag: RagService;

  constructor(private supabase: SupabaseClient) {
    this.rag = new RagService(supabase);
    this.catalog = new CatalogService(supabase, this.rag);
  }

  // ─── Tool Call Router ──────────────────────────────────────

  async handleToolCalls(message: any): Promise<any[]> {
    const results: any[] = [];
    const callId = message.call?.id;
    const toolCallList = message.toolCallList || [];

    for (const toolCall of toolCallList) {
      const startTime = Date.now();
      let result: string;
      let success = true;

      try {
        switch (toolCall.name) {
          case 'search_inventory':
            result = await this.searchInventory(toolCall.arguments, message);
            break;
          case 'book_appointment':
            result = await this.bookAppointment(toolCall.arguments, message);
            break;
          case 'share_location':
            result = await this.shareLocation(toolCall.arguments, message);
            break;
          case 'escalate_to_human':
            result = await this.escalateToHuman(toolCall.arguments, message);
            break;
          default:
            result = `Unknown tool: ${toolCall.name}`;
            success = false;
        }
      } catch (err: any) {
        result = `Tool failed: ${err.message}`;
        success = false;
      }

      const latencyMs = Date.now() - startTime;

      // Log action to DB
      await this.logAction(callId, toolCall.name, toolCall.arguments, result, success, latencyMs);

      results.push({
        toolCallId: toolCall.id,
        result: typeof result === 'string' ? result : JSON.stringify(result),
      });
    }

    return results;
  }

  // ─── Tool Implementations ─────────────────────────────────

  private async searchInventory(args: any, message: any): Promise<string> {
    const userId = await this.getUserIdFromCall(message);
    if (!userId) return 'Sorry, I could not find the business information.';

    const { query, max_budget, category } = args;

    // Use existing catalog service — hybrid search
    const result = await this.catalog.searchWithAlternatives(userId, query || '', {
      category,
      priceMax: max_budget,
    });

    const available = result.items?.filter((i: any) => i.quantity > 0) || [];

    if (available.length === 0) {
      return 'Sorry, I could not find any matching products right now. Would you like me to check something else?';
    }

    // Format for voice (short, spoken-friendly)
    const items = available.slice(0, 3).map((item: any) => {
      const price = item.price
        ? (item.price >= 100000 ? `${(item.price / 100000).toFixed(1)} lakh rupees` : `${item.price} rupees`)
        : 'price not listed';
      return `${item.item_name} at ${price}`;
    });

    if (items.length === 1) {
      return `I found ${items[0]}. Would you like to know more about it or schedule a visit?`;
    }

    return `I found ${available.length} options. The top ones are: ${items.join(', and ')}. Would you like details on any of these?`;
  }

  private async bookAppointment(args: any, message: any): Promise<string> {
    const userId = await this.getUserIdFromCall(message);
    if (!userId) return 'Sorry, I could not process the booking right now.';

    const { customer_name, customer_phone, service, date, time } = args;

    const taskTitle = `📅 Voice Booking: ${customer_name} — ${service || 'Visit'}`;
    const dueDate = date || new Date().toISOString().split('T')[0];

    const { error } = await this.supabase.from('wb_tasks').insert({
      user_id: userId,
      title: taskTitle,
      due_date: dueDate,
      is_completed: false,
    });

    if (error) {
      console.error('[Voice] Appointment creation failed:', error);
      return 'Sorry, I had trouble booking that. Let me connect you with the team.';
    }

    return `Done! I have booked your ${service || 'appointment'} for ${date} at ${time}. You will receive a confirmation on WhatsApp shortly.`;
  }

  private async shareLocation(args: any, message: any): Promise<string> {
    const userId = await this.getUserIdFromCall(message);
    if (!userId) return 'Sorry, I could not send the location right now.';

    const { customer_phone } = args;

    // Fetch business location
    const { data: user } = await this.supabase
      .from('wb_users')
      .select('business_address, google_maps_link, business_name')
      .eq('id', userId)
      .single();

    if (!user?.business_address && !user?.google_maps_link) {
      return 'I do not have the location details right now. Let me connect you with the team.';
    }

    const locationMsg = `📍 ${user.business_name || 'Our'} Location:\n${user.business_address || ''}\n${user.google_maps_link || ''}`.trim();

    // Send via WhatsApp using existing Baileys adapter
    const jid = `${customer_phone.replace(/\D/g, '')}@s.whatsapp.net`;
    const sent = await baileysAdapter.sendMessage(userId, jid, locationMsg);

    if (sent) {
      return 'I have sent our showroom location to your WhatsApp. You should receive it in a moment.';
    } else {
      return `Our address is ${user.business_address || user.google_maps_link}. I was not able to send it on WhatsApp but you can note it down.`;
    }
  }

  private async escalateToHuman(args: any, message: any): Promise<string> {
    const userId = await this.getUserIdFromCall(message);
    const { reason } = args;

    console.log(`📞 [Voice] Escalation requested: ${reason}`);

    // Notify business owner via WhatsApp
    if (userId) {
      const { data: session } = await this.supabase
        .from('wb_users')
        .select('id')
        .eq('id', userId)
        .single();

      if (session) {
        const callerPhone = message.call?.customer?.number || 'unknown';
        const notifyMsg = `🔔 Voice Call Escalation\nCaller: ${callerPhone}\nReason: ${reason}\nPlease call them back.`;

        // Try to send notification to business owner
        try {
          const ownerJid = `${userId.slice(0, 12)}@s.whatsapp.net`; // approximate
          await baileysAdapter.sendMessage(userId, ownerJid, notifyMsg);
        } catch { /* best effort */ }
      }
    }

    return 'I understand. Let me connect you with our team. Someone will call you back within the next 30 minutes. Thank you for your patience.';
  }

  // ─── Call Lifecycle Handlers ───────────────────────────────

  async handleStatusUpdate(message: any): Promise<void> {
    const callId = message.call?.id;
    const status = message.status;

    if (!callId) return;

    console.log(`  📞 [Vapi] Call ${callId}: ${status}`);

    // Find the user for this call (from phone number or assistant)
    const userId = await this.getUserIdFromCall(message);

    if (status === 'in-progress') {
      // Call started — create record
      await this.supabase.from('wb_calls').upsert({
        vapi_call_id: callId,
        user_id: userId,
        provider: 'vapi',
        direction: message.call?.type === 'outboundPhoneCall' ? 'outbound' : 'inbound',
        from_number: message.call?.customer?.number || null,
        to_number: message.call?.phoneNumber?.number || null,
        customer_phone: message.call?.customer?.number || null,
        status: 'in-progress',
        started_at: new Date().toISOString(),
      }, { onConflict: 'vapi_call_id' });
    } else if (status === 'ended') {
      // Call ended — update status
      await this.supabase
        .from('wb_calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('vapi_call_id', callId);
    }
  }

  async handleEndOfCallReport(message: any): Promise<void> {
    const callId = message.call?.id;
    if (!callId) return;

    const artifact = message.artifact || {};
    const transcript = artifact.transcript || '';
    const messages = artifact.messages || [];
    const recording = artifact.recording;
    const endedReason = message.endedReason || 'unknown';

    // Calculate duration
    const startedAt = message.call?.startedAt ? new Date(message.call.startedAt) : null;
    const endedAt = message.call?.endedAt ? new Date(message.call.endedAt) : null;
    const durationSec = startedAt && endedAt
      ? Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
      : null;

    // Determine outcome from actions taken
    const { data: actions } = await this.supabase
      .from('wb_call_actions')
      .select('action_name, success')
      .eq('call_id', callId);

    let outcome = 'resolved';
    if (actions?.some(a => a.action_name === 'book_appointment' && a.success)) {
      outcome = 'appointment_booked';
    } else if (actions?.some(a => a.action_name === 'escalate_to_human')) {
      outcome = 'escalated';
    } else if (endedReason === 'customer-ended-call' && durationSec && durationSec < 15) {
      outcome = 'dropped';
    }

    // Generate simple summary from transcript
    const summary = this.generateCallSummary(messages);

    // Update call record
    await this.supabase
      .from('wb_calls')
      .update({
        status: 'ended',
        ended_at: endedAt?.toISOString() || new Date().toISOString(),
        duration_sec: durationSec,
        transcript,
        summary,
        outcome,
        recording_url: recording?.url || null,
      })
      .eq('vapi_call_id', callId);

    console.log(`📞 [Vapi] Call ended — duration: ${durationSec}s, outcome: ${outcome}`);
  }

  async handleAssistantRequest(message: any): Promise<any> {
    // Dynamic assistant — resolve based on phone number or user
    const userId = await this.getUserIdFromCall(message);

    if (!userId) {
      return { error: 'Business not found for this phone number.' };
    }

    // Fetch business info for dynamic system prompt
    const { data: user } = await this.supabase
      .from('wb_users')
      .select('business_name, industry, services, business_address, google_maps_link')
      .eq('id', userId)
      .single();

    if (!user) {
      return { error: 'Business configuration not found.' };
    }

    // Return dynamic assistant config
    return {
      assistant: {
        firstMessage: `Hello! Welcome to ${user.business_name || 'our business'}. How can I help you today?`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: buildVoiceSystemPrompt(user),
          }],
        },
        voice: {
          provider: '11labs',
          voiceId: 'alloy',
        },
      },
    };
  }

  // ─── Helper Methods ────────────────────────────────────────

  private async getUserIdFromCall(message: any): Promise<string | null> {
    // Try to extract user ID from the call's phone number
    const phoneNumber = message.call?.phoneNumber?.number;
    if (!phoneNumber) return null;

    // Look up which user owns this Vapi phone number
    // For now, use the first user (single-tenant hackathon)
    const { data: users } = await this.supabase
      .from('wb_users')
      .select('id')
      .limit(1);

    return users?.[0]?.id || null;
  }

  private async logAction(
    vapiCallId: string,
    actionName: string,
    args: any,
    result: any,
    success: boolean,
    latencyMs: number
  ): Promise<void> {
    // Find call record by vapi_call_id
    const { data: call } = await this.supabase
      .from('wb_calls')
      .select('id')
      .eq('vapi_call_id', vapiCallId)
      .single();

    if (!call) return;

    await this.supabase.from('wb_call_actions').insert({
      call_id: call.id,
      action_name: actionName,
      action_args: args,
      action_result: typeof result === 'string' ? { message: result } : result,
      success,
      latency_ms: latencyMs,
    });
  }

  private generateCallSummary(messages: any[]): string {
    if (!messages || messages.length === 0) return 'No conversation recorded.';

    const customerMsgs = messages
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.message || m.content || '')
      .filter(Boolean);

    if (customerMsgs.length === 0) return 'Customer did not speak.';
    if (customerMsgs.length <= 2) return `Customer asked about: ${customerMsgs.join('. ')}`;

    return `${messages.length}-turn call. Customer topics: ${customerMsgs.slice(0, 3).join(', ')}`;
  }
}

// ─── Prompt Builder ──────────────────────────────────────────

function buildVoiceSystemPrompt(user: any): string {
  return `You are a friendly and helpful sales assistant for "${user.business_name || 'our business'}".
You are speaking on a PHONE CALL — keep responses SHORT (1-3 sentences max).

BUSINESS INFO:
- Name: ${user.business_name || 'Our Business'}
- Industry: ${user.industry || 'General'}
- Services: ${user.services?.join(', ') || 'Various'}
- Address: ${user.business_address || 'Not available'}

YOUR TOOLS:
- search_inventory: Search products when customer asks about availability, pricing, or options
- book_appointment: Book a visit, test drive, or meeting when customer wants to schedule
- share_location: Send showroom/office location to customer's WhatsApp
- escalate_to_human: Transfer to human when customer is frustrated, has a complaint, or explicitly asks

VOICE RULES:
1. Speak naturally like a real person — no bullet points, no markdown
2. Keep answers under 3 sentences. This is a phone call, not a document.
3. Confirm details before booking (name, date, time)
4. If customer speaks Hindi or Hinglish, respond in the same language
5. Always ask one clear question at a time — don't overwhelm
6. If unsure, say "Let me check" and use the appropriate tool
7. End calls warmly: "Thanks for calling! Have a great day."

NEVER:
- Reveal you are an AI unless directly asked
- Make up prices or availability — always use search_inventory
- Give medical, legal, or financial advice
- Share other customers' information`;
}
```

### 6.4 Register Route in `server.ts`

Add to `server.ts` after existing route registrations:

```typescript
// Voice agent webhook (Vapi) — NO auth required (Vapi calls directly)
const { vapiRoutes } = await import('./routes/vapi-routes.js');
await fastify.register(vapiRoutes, { prefix: '/api/vapi' });
```

**IMPORTANT:** This route must be registered BEFORE the auth plugin, or excluded from auth, because Vapi calls it directly without a Supabase JWT.

### 6.5 Auth Exclusion

In `auth-plugin.ts`, add `/api/vapi` to the skip list:

```typescript
// Skip auth for these paths
const publicPaths = ['/api/health', '/api/vapi/webhook'];
```

---

## 7. Frontend Implementation

### 7.1 New Page: Call Logs (`/calls`)

A simple table showing call history:

| Column | Source |
|---|---|
| Date/Time | `wb_calls.started_at` |
| Caller | `wb_calls.customer_phone` |
| Duration | `wb_calls.duration_sec` |
| Outcome | `wb_calls.outcome` (badge) |
| Summary | `wb_calls.summary` (truncated) |
| Actions | View transcript, Play recording |

### 7.2 Call Detail View

Click a call to see:
- Full transcript (from `wb_calls.transcript`)
- Actions taken during call (from `wb_call_actions`)
- Recording player (if `recording_url` exists)
- Link to WhatsApp conversation (if `conversation_id` exists)

### 7.3 Dashboard Widget

Add to main dashboard:
- "Today's Calls" count
- "Appointments Booked via Call" count
- "Average Call Duration"

---

## 8. Tool Definitions

### Tool 1: `search_inventory`

```json
{
  "type": "function",
  "function": {
    "name": "search_inventory",
    "description": "Search available products in the business inventory by name, category, budget, or type. Use this when the customer asks about availability, pricing, or wants to see options.",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "What the customer is looking for, e.g., 'SUV under 10 lakh' or 'red sedan'"
        },
        "max_budget": {
          "type": "number",
          "description": "Maximum budget in rupees if mentioned by customer"
        },
        "category": {
          "type": "string",
          "description": "Vehicle or product category like SUV, sedan, hatchback"
        }
      },
      "required": ["query"]
    }
  },
  "server": {
    "url": "https://vyavsayassist.app/api/vapi/webhook"
  },
  "messages": [
    { "type": "request-start", "content": "Let me check what we have available for you." },
    { "type": "request-failed", "content": "I'm having trouble checking inventory right now. Can I help with something else?" }
  ]
}
```

### Tool 2: `book_appointment`

```json
{
  "type": "function",
  "function": {
    "name": "book_appointment",
    "description": "Book a test drive, showroom visit, or meeting appointment for the customer. Always confirm the date and time with the customer before calling this tool.",
    "parameters": {
      "type": "object",
      "properties": {
        "customer_name": {
          "type": "string",
          "description": "Customer's name"
        },
        "customer_phone": {
          "type": "string",
          "description": "Customer's phone number"
        },
        "service": {
          "type": "string",
          "description": "Type of appointment: Test Drive, Showroom Visit, or Meeting"
        },
        "date": {
          "type": "string",
          "description": "Appointment date in YYYY-MM-DD format"
        },
        "time": {
          "type": "string",
          "description": "Appointment time like 3 PM or 15:00"
        }
      },
      "required": ["customer_name", "customer_phone", "service", "date", "time"]
    }
  },
  "server": {
    "url": "https://vyavsayassist.app/api/vapi/webhook"
  },
  "messages": [
    { "type": "request-start", "content": "Let me book that for you right away." },
    { "type": "request-failed", "content": "I had trouble with the booking. Let me connect you with our team." }
  ]
}
```

### Tool 3: `share_location`

```json
{
  "type": "function",
  "function": {
    "name": "share_location",
    "description": "Send the business showroom or office location to the customer's WhatsApp. Use this when customer asks for directions or location.",
    "parameters": {
      "type": "object",
      "properties": {
        "customer_phone": {
          "type": "string",
          "description": "Customer's phone number to send WhatsApp message to"
        }
      },
      "required": ["customer_phone"]
    }
  },
  "server": {
    "url": "https://vyavsayassist.app/api/vapi/webhook"
  },
  "messages": [
    { "type": "request-start", "content": "I'll send our location to your WhatsApp right now." },
    { "type": "request-failed", "content": "I couldn't send it on WhatsApp, but let me tell you the address." }
  ]
}
```

### Tool 4: `escalate_to_human`

```json
{
  "type": "function",
  "function": {
    "name": "escalate_to_human",
    "description": "Escalate the call to a human team member. Use when customer has a complaint, is frustrated, or explicitly asks to speak to a real person.",
    "parameters": {
      "type": "object",
      "properties": {
        "reason": {
          "type": "string",
          "description": "Why the customer needs human assistance"
        }
      },
      "required": ["reason"]
    }
  },
  "server": {
    "url": "https://vyavsayassist.app/api/vapi/webhook"
  },
  "messages": [
    { "type": "request-start", "content": "Let me get someone from our team to help you." }
  ]
}
```

---

## 9. Vapi Assistant Configuration

Full assistant config for API creation:

```json
{
  "name": "Vyavsay Sales Assistant",
  "firstMessage": "Hello! Welcome to our business. How can I help you today?",
  "model": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "maxTokens": 150,
    "messages": [
      {
        "role": "system",
        "content": "You are a friendly sales assistant. Keep responses under 3 sentences. This is a phone call, not text."
      }
    ]
  },
  "voice": {
    "provider": "openai",
    "voiceId": "alloy"
  },
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2",
    "language": "en"
  },
  "serverUrl": "https://vyavsayassist.app/api/vapi/webhook",
  "endCallFunctionEnabled": true,
  "silenceTimeoutSeconds": 30,
  "maxDurationSeconds": 600,
  "backgroundSound": "office",
  "serverMessages": [
    "tool-calls",
    "status-update",
    "end-of-call-report",
    "transcript",
    "hang"
  ]
}
```

---

## 10. Environment Variables

Add to `backend/.env` on server:

```bash
# Vapi Voice Agent
VAPI_API_KEY=your-vapi-private-key
VAPI_PHONE_NUMBER_ID=your-phone-number-id
VAPI_ASSISTANT_ID=your-assistant-id

# Exotel (optional — for Indian number)
EXOTEL_API_KEY=your-exotel-api-key
EXOTEL_API_TOKEN=your-exotel-api-token
EXOTEL_ACCOUNT_SID=your-exotel-sid
EXOTEL_SUBDOMAIN=your-exotel-subdomain
```

Add to `backend/src/config/environment.ts`:

```typescript
VAPI_API_KEY: process.env.VAPI_API_KEY || '',
VAPI_PHONE_NUMBER_ID: process.env.VAPI_PHONE_NUMBER_ID || '',
VAPI_ASSISTANT_ID: process.env.VAPI_ASSISTANT_ID || '',
```

---

## 11. Deployment Steps

### 11.1 Create Feature Branch

```bash
git checkout -b feature/voice-agent
```

### 11.2 Create Files

```
1. backend/database/migrations/005-voice-calls.sql
2. backend/src/routes/vapi-routes.ts
3. backend/src/services/voice-service.ts
4. Update backend/src/server.ts (register vapi routes)
5. Update backend/src/plugins/auth-plugin.ts (skip auth for /api/vapi)
6. Update backend/src/config/environment.ts (add VAPI env vars)
```

### 11.3 Run Migration

```bash
# On server or via Supabase dashboard
psql $DATABASE_URL -f backend/database/migrations/005-voice-calls.sql
```

### 11.4 Set Environment Variables on Server

```bash
ssh -i "vyavsay.pem" ubuntu@51.20.19.169
echo 'VAPI_API_KEY=xxx' >> ~/Vyavsay_Baileys/backend/.env
echo 'VAPI_PHONE_NUMBER_ID=xxx' >> ~/Vyavsay_Baileys/backend/.env
echo 'VAPI_ASSISTANT_ID=xxx' >> ~/Vyavsay_Baileys/backend/.env
```

### 11.5 Deploy

```bash
ssh -i "vyavsay.pem" ubuntu@51.20.19.169 \
  "cd ~/Vyavsay_Baileys && git pull && docker compose up -d --build backend"
```

### 11.6 Configure Vapi

1. Create assistant via API or dashboard
2. Create 4 tools via API or dashboard
3. Assign phone number to assistant
4. Set server URL to `https://vyavsayassist.app/api/vapi/webhook`

### 11.7 Test

Call the Vapi phone number from your mobile and test each tool.

---

## 12. Testing Plan

### Smoke Tests (5 min)

| Test | Say This | Expected |
|---|---|---|
| Greeting | "Hi" | AI greets back, asks how to help |
| Inventory search | "Do you have any SUVs?" | AI calls search_inventory, reads results |
| Appointment | "Book a test drive for tomorrow at 3 PM" | AI confirms details, books via book_appointment |
| Location | "Where is your showroom?" | AI calls share_location, confirms WhatsApp sent |
| Escalation | "I want to talk to a real person" | AI calls escalate_to_human, says team will call back |
| End call | "Thank you, bye" | AI says goodbye, call ends |

### Verify in Dashboard

After each test call:
- [ ] Call appears in `wb_calls` table
- [ ] Transcript is saved
- [ ] Actions appear in `wb_call_actions`
- [ ] Duration and outcome are correct
- [ ] WhatsApp location message received (for share_location test)
- [ ] Task created in wb_tasks (for appointment test)

---

## 13. Cost Estimates

### Per-Call Cost (Vapi + GPT-4o-mini)

| Component | Cost/Min | 3-Min Call | 5-Min Call |
|---|---|---|---|
| Vapi platform | $0.05 | $0.15 | $0.25 |
| GPT-4o-mini (via Vapi) | ~$0.02 | $0.06 | $0.10 |
| Deepgram STT | ~$0.01 | $0.03 | $0.05 |
| OpenAI TTS | ~$0.02 | $0.06 | $0.10 |
| Telephony | ~$0.01 | $0.03 | $0.05 |
| **Total** | **~$0.11/min** | **~$0.33** | **~$0.55** |
| **In INR** | **~Rs 9/min** | **~Rs 28** | **~Rs 46** |

### Hackathon Budget

- 20 test calls × 3 min avg = 60 min × $0.11 = **~$6.60 (~Rs 550)**
- Vapi free tier likely covers this

---

## 14. Post-Hackathon Roadmap

### Week 1-2: Indian Number via Exotel
- Set up Exotel paid account
- Configure SIP trunk → Vapi
- Test with Indian +91 number
- Handle Hindi/Hinglish detection

### Week 3-4: Outbound Calling
- AI calls customers for follow-ups (stale leads)
- Schedule outbound calls from dashboard
- Post-call WhatsApp summary to customer

### Month 2: Migrate to OpenAI SIP Direct
- Remove Vapi dependency
- Direct SIP from Exotel → OpenAI Realtime API
- 50% cost reduction
- Better latency for India

### Month 3: Analytics & Optimization
- Call analytics dashboard
- Cost tracking per call/conversation
- Voice-to-text quality monitoring
- A/B test different voice personas

---

> **Next Step:** Create the feature branch, implement the backend code, deploy, and test with a live call.
