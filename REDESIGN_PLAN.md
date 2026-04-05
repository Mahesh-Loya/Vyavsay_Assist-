# Vyavsay Frontend Redesign — Execution Plan

> **Status:** COMPLETE
> **Design:** Pastel Minimal v3 (Satoshi + Instrument Sans, warm cream, floating dark nav)
> **Constraint:** Zero backend changes. All API calls, auth flow, and data contracts preserved exactly.

---

## Design System Reference

| Token | Value |
|-------|-------|
| **Heading Font** | Satoshi (400/500/700/900) |
| **Body Font** | Instrument Sans (400–700) |
| **Base BG** | `#FEFCF8` (cream-50) |
| **Card BG** | `#FAF6EE` (cream-100) / pastel fills |
| **Text Primary** | `#2D2A26` (ink-300) |
| **Text Secondary** | `#6B6459` (ink-100) |
| **Text Muted** | `#8C8477` (ink-50) |
| **Pastels** | lavender `#E8E4F7`, sage `#DDE8DC`, peach `#F7E4DB`, sky `#DBE8F0`, honey `#F0EAD2`, rose `#F2DDE4`, mint `#D4EDE6`, lilac `#DDD6F3` |
| **Border Radius** | 20px cards, 2xl inputs, full pills |
| **Touch Target** | 48px minimum |
| **Nav** | Floating dark pill (bottom), Fixed sidebar (desktop) |
| **Shadows** | None — color separation only |
| **Texture** | Subtle SVG grain overlay |
| **Icons** | Lucide React (existing) |
| **Animation** | Framer Motion (existing) |

---

## CRITICAL GAPS — Audit Findings (Must Address)

### GAP 1: No Error Boundary (SEVERITY: HIGH)
**Problem:** Zero React Error Boundaries in the app. If any component throws during redesign, the entire app white-screens with no recovery.
**Fix:** Phase 0 must create `components/ErrorBoundary.tsx` and wrap `<App />` in it.
**File:** `App.tsx`

### GAP 2: Existing `cn()` in Conversations.tsx (SEVERITY: MEDIUM)
**Problem:** `Conversations.tsx` already imports `clsx` + `tailwind-merge` and defines its own local `cn()` function (lines 15-20). Our Phase 0 creates a shared `lib/utils.ts` with `cn()`. If we don't unify, two competing utilities exist.
**Fix:** Phase 0 creates the shared `cn()`. Phase 6 (Conversations) must delete the local one and import from `lib/utils`. `clsx` and `tailwind-merge` are already in `package.json` — no new install needed.

### GAP 3: `index.html` body has hardcoded dark styles (SEVERITY: HIGH)
**Problem:** `<body class="bg-[#0a0a0c] text-slate-200">` is in `index.html` line 12. This will flash dark background before React hydrates, fighting our cream theme.
**Fix:** Phase 0 must change body class to `bg-[#FEFCF8] text-[#2D2A26]`.
**File:** `frontend/index.html:12`

### GAP 4: CSS utility classes used across ALL pages (SEVERITY: HIGH)
**Problem:** `index.css` defines `.glass`, `.premium-card`, `.btn-primary`, `.btn-secondary` classes used in multiple pages. If Phase 0 removes/renames these before all pages are redesigned, un-redesigned pages break immediately.
**Fix:** Phase 0 must KEEP the old CSS classes alongside the new ones. Add a `/* LEGACY — remove after Phase 14 */` comment. Only remove in Phase 14 after all pages are migrated. This is a **transitional compatibility layer**.
**Files:** `frontend/src/index.css`

### GAP 5: Framer Motion AnimatePresence structure dependency (SEVERITY: HIGH)
**Problem:** Multiple pages use `AnimatePresence` with `mode="wait"` or `mode="popLayout"`. These depend on the exact number and order of direct children. Changing JSX structure inside AnimatePresence will freeze animations or cause flickers.
**Pages affected:** QRScanner, Conversations, AIBrain, KnowledgeBase, InventoryTable, Tasks
**Fix:** Each phase's builder agent instructions must include: "Preserve AnimatePresence children count and keying. Each direct child of AnimatePresence must have a unique `key` prop. Do NOT wrap children in extra divs."

### GAP 6: Framer Motion `layoutId` in Conversations (SEVERITY: MEDIUM)
**Problem:** `Conversations.tsx:134` uses `layoutId="active-chat-indicator"` for a shared layout animation. If the indicator element moves to a different nesting level or gets wrapped, animation breaks silently.
**Fix:** Phase 6 builder must preserve `layoutId="active-chat-indicator"` on the active chat indicator element, at the same nesting depth.

### GAP 7: QRScanner polling refs — timing sensitive (SEVERITY: HIGH)
**Problem:** Three `useRef` variables (`isRecoveringSession`, `disconnectedPollsRef`, `forcedResetRef`) track polling state across renders. The polling `useEffect` (lines 24-101) has a 2s interval with recovery logic after 30s (15 polls). These refs are NOT in dependency arrays.
**Fix:** Phase 5 builder instructions: "Copy the ENTIRE `useEffect` block (lines 24-101) and all three `useRef` declarations (lines 20-22) VERBATIM. Do not rename variables, do not change the dependency array `[status, user]`, do not wrap in custom hooks."

### GAP 8: Conversations message fetch has no abort (SEVERITY: MEDIUM)
**Problem:** `Conversations.tsx:34-38` fetches messages on `selectedConvo` change with no AbortController. Rapid conversation switching causes race conditions — old fetches overwrite new data.
**Fix:** Phase 6 should add `AbortController` cleanup to the message fetch effect. This is a bug fix, not a design change, so it's safe.

### GAP 9: `window.location.href` mixed with `navigate()` (SEVERITY: LOW-MEDIUM)
**Problem:** Three places use hard `window.location.href` redirects (QRScanner:220, Settings:56, client.ts:28) which cause full page reloads, losing React state. This is existing behavior, not caused by redesign.
**Fix:** Keep as-is during redesign. Do NOT change to `navigate()` — the hard reloads may be intentional (session reset needs full state clear). Flag for post-redesign cleanup.

### GAP 10: Drag-and-drop breaks with CSS transforms (SEVERITY: MEDIUM)
**Problem:** `Leads.tsx` uses native HTML5 drag-and-drop (`dataTransfer.setData`). CSS `transform` on draggable elements shifts pointer coordinates, making drop zones unreliable.
**Fix:** Phase 7 builder instructions: "Do NOT apply CSS `transform`, `scale()`, or `translate()` to draggable lead cards or their parent containers. Use padding/margin for spacing, not transforms. Framer Motion `whileDrag` is safe but `layout` animations on drag targets are NOT."

### GAP 11: FileUpload.tsx manual DOM manipulation (SEVERITY: MEDIUM)
**Problem:** `FileUpload.tsx:60-64` manually sets `fileInputRef.current.files` via `DataTransfer` API and dispatches a synthetic `change` event. This is for drag-and-drop file handling.
**Fix:** Phase 12 builder instructions: "Preserve the `fileInputRef`, the `DataTransfer` API usage, and the synthetic event dispatch exactly. The hidden `<input type="file">` must remain in the DOM even if visually hidden."

### GAP 12: InventoryTable search debounce (SEVERITY: LOW)
**Problem:** 300ms `setTimeout` debounce in `InventoryTable.tsx:43-49`. If input animation exceeds 300ms, the search fires before the user sees the input settle.
**Fix:** Keep debounce at 300ms. Ensure input animations are < 200ms (Framer Motion `duration: 0.15`).

### GAP 13: Tailwind `whatsapp` color token (SEVERITY: LOW)
**Problem:** Current config has `whatsapp: "#25d366"` used for session status indicators. Our new palette doesn't include this.
**Fix:** Phase 0 must include `whatsapp: "#25d366"` in the new tailwind config to preserve QR/session status colors.

### GAP 14: Vite proxy for `/api` (SEVERITY: LOW)
**Problem:** `vite.config.ts` proxies `/api` to `localhost:3005`. This is dev-only and won't break, but the proxy must not be removed during any config changes.
**Fix:** Phase 0 — do NOT modify `vite.config.ts`.

---

## Phase Order & Status Tracker

| Phase | Target | Status | Files | Notes |
|-------|--------|--------|-------|-------|
| **0** | Design Foundation | `[x]` COMPLETE | tailwind.config.js, index.css, index.html, 8+ new shared components | Tokens, fonts, UI primitives |
| **1** | Login | `[x]` COMPLETE | Login.tsx | Supabase auth calls preserved |
| **2** | Layout Shell | `[x]` COMPLETE | Sidebar.tsx → DesktopSidebar + MobileBottomNav + AppShell, App.tsx | Navigation restructure |
| **3** | Dashboard | `[x]` COMPLETE | Dashboard.tsx | API: /users, /analytics, /sessions, /tasks |
| **4** | Onboarding | `[x]` COMPLETE | Onboarding.tsx | API: PATCH /users |
| **5** | QR Scanner | `[x]` COMPLETE | QRScanner.tsx | API: /sessions polling (2s interval) |
| **6** | Conversations | `[x]` COMPLETE | Conversations.tsx | API: /conversations, /messages |
| **7** | Leads | `[x]` COMPLETE | Leads.tsx | API: /leads, drag-drop stage update |
| **8** | Tasks | `[x]` COMPLETE | Tasks.tsx | API: /tasks toggle |
| **9** | Appointments | `[x]` COMPLETE | Appointments.tsx | API: /tasks CRUD, calendar logic |
| **10** | Analytics | `[x]` COMPLETE | Analytics.tsx | API: /analytics |
| **11** | Settings | `[x]` COMPLETE | Settings.tsx | API: /users, /sessions delete |
| **12** | AI Brain + Components | `[x]` COMPLETE | AIBrain.tsx, InventoryTable.tsx, ItemModal.tsx, SchemaManager.tsx, FileUpload.tsx, ColumnMapper.tsx | Most complex — 6 files, 12 API endpoints |
| **13** | Knowledge Base | `[x]` COMPLETE | KnowledgeBase.tsx | API: /knowledge CRUD |
| **14** | Final QA & Polish | `[x]` COMPLETE | All files | Cross-page consistency, responsive, a11y |

---

## Phase 0 — Design Foundation

**Goal:** Set up design tokens, fonts, reusable UI primitives, error boundary, and transitional compatibility layer.

### Addresses Gaps: #1, #2, #3, #4, #13, #14

### Files to Modify
- `frontend/tailwind.config.js` — Replace dark colors with pastel system. KEEP `whatsapp: "#25d366"` (Gap #13). Do NOT touch `vite.config.ts` (Gap #14).
- `frontend/index.html` — Replace fonts (Outfit/Inter → Satoshi/Instrument Sans). Change `<body>` class from `bg-[#0a0a0c] text-slate-200` to `bg-[#FEFCF8] text-[#2D2A26]` (Gap #3).
- `frontend/src/index.css` — Add new light base styles, grain texture, typography. **KEEP all existing classes** (`.glass`, `.premium-card`, `.btn-primary`, `.btn-secondary`) with `/* LEGACY */` comment for transitional compatibility (Gap #4). Remove only in Phase 14.

### Files to Create
- `frontend/src/components/ErrorBoundary.tsx` — React Error Boundary with fallback UI (Gap #1). Wrap `<App />` in `App.tsx`.
- `frontend/src/lib/utils.ts` — Shared `cn()` using existing `clsx` + `tailwind-merge` deps (Gap #2). All phases will import from here.
- `frontend/src/hooks/useMediaQuery.ts` — Responsive breakpoint detection
- `frontend/src/components/ui/Button.tsx` — Primary (dark ink) / Soft (pastel) / Ghost variants, loading state, 48px min height
- `frontend/src/components/ui/Card.tsx` — Pastel card with configurable color prop, 20px radius, no shadows
- `frontend/src/components/ui/Input.tsx` — Pastel-bg input with label + error state, 54px height
- `frontend/src/components/ui/Badge.tsx` — Status pills (Hot=rose, Warm=honey, Cold=cream, Live=green dot)
- `frontend/src/components/ui/Modal.tsx` — Bottom sheet (mobile) / centered dialog (desktop) via useMediaQuery
- `frontend/src/components/ui/EmptyState.tsx` — Icon + message + CTA button
- `frontend/src/components/ui/PageHeader.tsx` — Satoshi page titles with consistent spacing
- `frontend/src/components/ui/Toast.tsx` — Toast notification

### Files NOT Modified
- `frontend/vite.config.ts` — Hands off (Gap #14)
- `frontend/src/api/*` — Hands off (no backend changes)
- `frontend/src/context/*` — Hands off (auth untouched)

### Backend Impact: NONE

### Subagent Strategy
- **Agent A (Builder):** tailwind.config.js, index.html, index.css, lib/utils.ts, ErrorBoundary.tsx, App.tsx ErrorBoundary wrap
- **Agent B (Builder):** All UI components (Button, Card, Input, Badge, Modal, EmptyState, PageHeader, Toast) + useMediaQuery hook
- **Review Agent:** Verify: (1) `npm run build` passes, (2) existing pages still render with legacy classes, (3) ErrorBoundary catches test throw, (4) new components are typed with TypeScript, (5) fonts load from CDN

---

## Phase 1 — Login Page

**Goal:** Redesign Login.tsx to match pastel minimal design.

### Backend Contracts (MUST PRESERVE)
```
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signUp({ email, password })
navigate('/dashboard') on success
navigate('/onboarding') for new users (if profile incomplete)
```

### Design Spec
- Warm cream background with gradient mesh
- Satoshi heading: "Welcome back."
- Pastel-bg inputs (honey for email, lavender for password)
- Dark ink primary button
- Subtle color band at bottom
- No borders, no shadows on inputs
- Trust badges (WhatsApp Official, 256-bit Secure)

### Files to Modify
- `frontend/src/pages/Login.tsx`

### Subagent Strategy
- **Agent A (Builder):** Rewrite Login.tsx using new UI components + design
- **Review Agent:** Verify auth flow works — signIn, signUp, error states, navigation, loading states all preserved

---

## Phase 2 — Layout Shell (Navigation)

**Goal:** Replace the hover-expand dark sidebar with a responsive layout: fixed sidebar on desktop, floating dark pill nav on mobile.

### Backend Contracts (MUST PRESERVE)
```
useAuth() — user, signOut
All 9 NavLink routes preserved
```

### Design Spec
- **Desktop (>=1024px):** Fixed w-60 sidebar, cream background, Satoshi nav labels, pastel hover states, user avatar bottom
- **Mobile (<1024px):** Floating dark pill bottom nav with 5 items (Home, Chats, Leads, AI, More). "More" opens drawer with remaining items.
- Active state: filled icon + bold label (dark pill bg on mobile)

### Files to Modify
- `frontend/src/App.tsx` — Use new AppShell wrapper

### Files to Create
- `frontend/src/components/layout/DesktopSidebar.tsx`
- `frontend/src/components/layout/MobileBottomNav.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/layout/MoreDrawer.tsx`

### Files to Retire
- `frontend/src/components/Sidebar.tsx` — Replaced by DesktopSidebar + MobileBottomNav

### Subagent Strategy
- **Agent A (Builder):** Create DesktopSidebar + MobileBottomNav + MoreDrawer
- **Agent B (Builder):** Create AppShell + modify App.tsx
- **Review Agent:** Verify all 9 routes accessible on both mobile/desktop, signOut works, active states correct, no layout overflow

---

## Phase 3 — Dashboard

**Goal:** Redesign Dashboard.tsx with pastel stat cards, quick actions, activity timeline.

### Backend Contracts (MUST PRESERVE)
```
client.get('/users/{user.id}')       → user profile
client.get('/analytics')              → stats (total_leads, active_conversations, etc.)
client.get('/sessions')               → WhatsApp session list
client.get('/tasks')                  → appointments/tasks
navigate('/qr-scanner')              → Link WhatsApp CTA
navigate('/ai-brain')                → Train AI CTA
navigate('/appointments')            → View appointments CTA
```

### Design Spec
- Greeting header: date + "Hi, {name}" in Satoshi
- 4 pastel stat cards (lavender/sage/peach/sky) with large serif numbers
- Horizontal scroll quick action pills (dark primary + pastel secondary)
- Activity timeline with pastel avatar circles + timestamp
- No borders, no shadows

### Files to Modify
- `frontend/src/pages/Dashboard.tsx`

### Subagent Strategy
- **Agent A (Builder):** Rewrite Dashboard.tsx with new design
- **Review Agent:** Verify all 4 API calls fire correctly, data renders, navigation works, loading/empty states handled

---

## Phase 4 — Onboarding

**Goal:** Redesign Onboarding.tsx as a clean multi-step wizard.

### Backend Contracts (MUST PRESERVE)
```
client.patch('/users/{user.id}', { business_name, industry, services })
navigate('/dashboard') on completion
```

### Design Spec
- Step indicator (1 of 2) with pastel progress
- Large Satoshi headings per step
- Pastel-bg form inputs
- Dark CTA button

### Files to Modify
- `frontend/src/pages/Onboarding.tsx`

### Subagent Strategy
- **Agent A (Builder):** Rewrite Onboarding.tsx
- **Review Agent:** Verify PATCH call fires with correct payload, navigation works, validation preserved

---

## Phase 5 — QR Scanner

**Goal:** Redesign QRScanner.tsx while preserving the 2-second polling loop and session recovery logic.

### Backend Contracts (MUST PRESERVE — CRITICAL)
```
client.post('/sessions', {})                      → create session
client.get('/sessions/{user.id}/status')          → poll (every 2s)
States: connected, qr_pending, connecting, no_session, disconnected, error
Recovery logic: isRecoveringSession, disconnectedPollsRef, forcedResetRef
```

### Design Spec
- Large QR code display area on pastel-lilac card
- Status messages below (scanning, connecting, connected)
- Connected state: green pastel success card with phone number
- Error state: peach card with retry button

### Files to Modify
- `frontend/src/pages/QRScanner.tsx`

### Subagent Strategy
- **Agent A (Builder):** Rewrite QRScanner.tsx — MUST keep all useEffect/polling/ref logic intact
- **Review Agent:** Verify polling fires at 2s interval, all 6 status states handled, session recovery works, cleanup on unmount

---

## Phase 6 — Conversations

**Goal:** Redesign Conversations.tsx with WhatsApp-style chat list and message view.

### Backend Contracts (MUST PRESERVE)
```
client.get('/conversations')                           → list all
client.get('/conversations/{id}/messages')             → messages
client.patch('/conversations/{id}', { ai_paused })     → toggle AI
client.post('/conversations/{id}/messages', { content }) → send reply
```

### Design Spec
- **Mobile:** Stacked view — chat list → tap → message view → back
- **Desktop:** Split pane — list left, messages right
- Pastel avatar circles per contact (single initial)
- Unread: peach highlight + count badge
- Read: cream background
- Message bubbles: sent (pastel-sage right), received (cream-100 left)
- AI toggle: subtle switch in header
- Compose bar: pastel-bg input with send button

### Files to Modify
- `frontend/src/pages/Conversations.tsx`

### Subagent Strategy
- **Agent A (Builder):** Chat list redesign + responsive layout
- **Agent B (Builder):** Message view + compose bar + AI toggle
- **Review Agent:** Verify all 4 API calls work, message list scrolls to bottom, AI toggle persists, send works, real-time message display

---

## Phase 7 — Leads

**Goal:** Redesign Leads.tsx with pastel lead cards and working drag-drop.

### Backend Contracts (MUST PRESERVE)
```
client.get('/leads')                          → fetch all
client.patch('/leads/{id}', { stage })        → update stage (optimistic)
Stages: new, contacted, negotiating, won, lost
```

### Design Spec
- **Mobile:** List view with pastel cards + left accent bar for status color
- **Desktop:** Kanban columns with drag-drop
- Filter pills: pastel per status (rose=Hot, honey=Warm, cream=Cold)
- Lead card: pastel avatar + name + phone + interested car + timestamp
- Search bar with pastel-bg

### Files to Modify
- `frontend/src/pages/Leads.tsx`

### Subagent Strategy
- **Agent A (Builder):** Rewrite Leads.tsx with responsive list/kanban
- **Review Agent:** Verify GET loads data, drag-drop PATCH fires correctly, optimistic update works, search filters, stages match backend enum

---

## Phase 8 — Tasks

**Goal:** Redesign Tasks.tsx as a clean checklist with pastel styling.

### Backend Contracts (MUST PRESERVE)
```
client.get('/tasks')                                  → fetch all
client.patch('/tasks/{id}', { is_completed })         → toggle done
```

### Design Spec
- Satoshi page header
- Pending tasks: cream cards with checkbox
- Completed tasks: muted/strikethrough, grouped below
- Empty state with illustration placeholder

### Files to Modify
- `frontend/src/pages/Tasks.tsx`

### Subagent Strategy
- **Agent A (Builder):** Rewrite Tasks.tsx
- **Review Agent:** Verify toggle PATCH fires, completed state renders correctly, empty state shows

---

## Phase 9 — Appointments

**Goal:** Redesign Appointments.tsx with calendar and pastel appointment cards.

### Backend Contracts (MUST PRESERVE)
```
client.get('/tasks')                                          → fetch (filter by due_date)
client.patch('/tasks/{id}', { is_completed })                 → mark complete
client.delete('/tasks/{id}')                                  → delete
client.post('/tasks', { title, due_date, is_completed })      → create
extractInfo() helper: parse "Customer - Service" title format
```

### Design Spec
- Month calendar grid with pastel day highlights
- Appointment list below calendar for selected day
- Add appointment: Modal/bottom sheet with pastel form
- Cards with pastel accent per status

### Files to Modify
- `frontend/src/pages/Appointments.tsx`

### Subagent Strategy
- **Agent A (Builder):** Calendar component + appointment list
- **Agent B (Builder):** Add appointment modal
- **Review Agent:** Verify all 4 CRUD endpoints work, calendar date selection works, extractInfo() logic preserved, modal open/close

---

## Phase 10 — Analytics

**Goal:** Redesign Analytics.tsx with clean pastel metric cards and charts.

### Backend Contracts (MUST PRESERVE)
```
client.get('/analytics')   → full analytics payload
```

### Design Spec
- Stat cards in pastel fills (matching dashboard style)
- Clean line/bar charts with pastel color scheme
- Responsive grid layout

### Files to Modify
- `frontend/src/pages/Analytics.tsx`

### Subagent Strategy
- **Agent A (Builder):** Rewrite Analytics.tsx
- **Review Agent:** Verify API call fires, all data fields rendered, no chart rendering errors

---

## Phase 11 — Settings

**Goal:** Redesign Settings.tsx with clean pastel forms.

### Backend Contracts (MUST PRESERVE)
```
client.get('/users/{user.id}')                                    → fetch profile
client.patch('/users/{user.id}', { auto_reply_enabled })          → toggle AI
client.patch('/users/{user.id}', { ...profile })                  → save profile
client.delete('/sessions/{user.id}')                              → reset sessions
useAuth() for user.id
```

### Design Spec
- Grouped setting sections with Satoshi headings
- Pastel-bg form inputs
- Toggle switches for auto-reply
- Danger zone: session reset with confirmation dialog
- WhatsApp connection status section

### Files to Modify
- `frontend/src/pages/Settings.tsx`

### Subagent Strategy
- **Agent A (Builder):** Rewrite Settings.tsx
- **Review Agent:** Verify all 4 API calls work, profile save persists, toggle updates, session delete works with confirmation

---

## Phase 12 — AI Brain + All Sub-Components

**Goal:** Redesign the most complex page: AIBrain.tsx + 5 child components.

### Backend Contracts (MUST PRESERVE — 12 ENDPOINTS)
```
# AIBrain.tsx
client.get('/schema')                                     → fetch inventory schema
client.get('/catalog/stats')                              → inventory counts
client.get('/knowledge')                                  → knowledge items
client.post('/knowledge', { content })                    → add knowledge
client.delete('/knowledge/{id}')                          → delete knowledge
client.patch('/schema', { schema })                       → update schema
client.get('/catalog/export?type={type}', { responseType: 'blob' }) → export

# InventoryTable.tsx
client.get('/catalog?page=&limit=&status=&sort=&search=') → paginated list
client.patch('/catalog/{id}/sold')                        → mark sold
client.delete('/catalog/{id}')                            → delete item

# ItemModal.tsx
client.post('/catalog', payload)                          → create item
client.patch('/catalog/{id}', payload)                    → update item

# FileUpload.tsx
client.post('/files/upload', formData)                    → upload file
client.post('/files/{id}/process', { columnMapping, rows }) → process

# ColumnMapper.tsx — no API calls (pure UI)
# SchemaManager.tsx — no API calls (parent handles save)
```

### Design Spec
- **Tabs:** Knowledge / Products — pastel pill switcher
- **Knowledge tab:** List of knowledge cards with pastel icons + green dot status
- **Products tab:** Inventory table with pastel header, grid/table toggle
- **ItemModal:** Bottom sheet (mobile) / centered (desktop) with dynamic pastel fields
- **SchemaManager:** Clean field editor with add/remove/configure
- **FileUpload:** Step wizard (upload → map → process → done)
- **ColumnMapper:** Clean mapping interface with preview

### Files to Modify
- `frontend/src/pages/AIBrain.tsx`
- `frontend/src/components/InventoryTable.tsx`
- `frontend/src/components/ItemModal.tsx`
- `frontend/src/components/SchemaManager.tsx`
- `frontend/src/components/FileUpload.tsx`
- `frontend/src/components/ColumnMapper.tsx`

### Subagent Strategy
- **Agent A (Builder):** AIBrain.tsx main page + tabs
- **Agent B (Builder):** InventoryTable.tsx redesign
- **Agent C (Builder):** ItemModal.tsx + SchemaManager.tsx
- **Agent D (Builder):** FileUpload.tsx + ColumnMapper.tsx
- **Review Agent 1:** Verify all 12 API endpoints fire correctly
- **Review Agent 2:** Verify prop contracts between parent-child components match, dynamic schema rendering works

---

## Phase 13 — Knowledge Base (Standalone)

**Goal:** Redesign KnowledgeBase.tsx if it exists as a separate page.

### Backend Contracts (MUST PRESERVE)
```
client.get('/knowledge')              → fetch items
client.post('/knowledge', { content }) → add
client.delete('/knowledge/{id}')      → delete
```

### Files to Modify
- `frontend/src/pages/KnowledgeBase.tsx`

### Subagent Strategy
- **Agent A (Builder):** Rewrite KnowledgeBase.tsx
- **Review Agent:** Verify all 3 API calls work

---

## Phase 14 — Final QA & Polish

**Goal:** Cross-page consistency pass, responsive testing, accessibility, build verification.

### Checklist
- [ ] `npm run build` — zero errors
- [ ] All pages render on 375px mobile
- [ ] All pages render on 1440px desktop
- [ ] Auth flow: login → onboarding → dashboard
- [ ] WhatsApp QR: connect → show status
- [ ] Conversations: list → select → send message
- [ ] Leads: view → drag → stage update
- [ ] Tasks: toggle completion
- [ ] Appointments: calendar → add → delete
- [ ] AI Brain: knowledge CRUD, inventory CRUD, import/export
- [ ] Settings: save profile, toggle AI, reset sessions
- [ ] Analytics: data renders
- [ ] Navigation: all routes accessible on mobile and desktop
- [ ] Sign out works from every page
- [ ] Grain texture visible but subtle
- [ ] Fonts load (Satoshi + Instrument Sans)
- [ ] No console errors

### Subagent Strategy
- **Agent A (QA):** Build test + mobile viewport test
- **Agent B (QA):** Desktop viewport + cross-page navigation
- **Agent C (QA):** API contract audit — grep all client.* calls and verify unchanged

---

## Execution Rules

1. **One phase at a time.** Do not start Phase N+1 until Phase N review passes.
2. **Backend compatibility is non-negotiable.** Every API call, payload shape, auth header, and error handler must remain identical.
3. **Use /ui-ux-pro-max skill** for each page to validate design decisions against UX best practices.
4. **Parallel builder agents** — each phase deploys 2-4 builder subagents working on independent files.
5. **Review agents** — after builders complete, deploy review agents that:
   - Read the modified files
   - Grep for all `client.get`, `client.post`, `client.patch`, `client.delete`, `supabase.auth` calls and compare against the API Master Reference
   - Verify `npm run build` passes
   - Check responsive layout at 375px and 1440px
6. **Update this file** — mark phase status as `[x] COMPLETE` after review passes.
7. **No new dependencies** unless absolutely necessary. `clsx` and `tailwind-merge` already in package.json.
8. **Preserve all business logic** — only change presentation layer (JSX + classes). Do not refactor hooks, effects, state, or API logic.

### Safety Rules (from audit)

9. **AnimatePresence children** — Never change the count or nesting of direct children inside `<AnimatePresence>`. Each child must have a stable unique `key`. Do not wrap in extra divs. (Gap #5)
10. **useEffect blocks** — Copy hooks, refs, and effects VERBATIM from old code. Do not rename ref variables, change dependency arrays, or extract into custom hooks during redesign. (Gap #7)
11. **No CSS transforms on drag targets** — Leads page drag-drop uses native HTML5 DnD. CSS `transform`, `scale()`, `translate()` on draggable elements break pointer coordinates. (Gap #10)
12. **Keep hidden file inputs** — FileUpload's `<input type="file">` must remain in DOM even if visually hidden. The DataTransfer API needs it. (Gap #11)
13. **Animation durations < 200ms** — Keep all Framer Motion micro-interactions under 200ms to avoid interfering with the 300ms search debounce and 2000ms polling interval. (Gap #12)
14. **Legacy CSS classes** — Do NOT remove `.glass`, `.premium-card`, `.btn-primary`, `.btn-secondary` from index.css until Phase 14. Un-redesigned pages depend on them. (Gap #4)
15. **`window.location.href` redirects** — Keep the 3 existing hard redirects (client.ts:28, QRScanner:220, Settings:56) as-is. Do not convert to `navigate()`. (Gap #9)

---

## API Endpoint Master Reference

| Endpoint | Method | Used In | Payload |
|----------|--------|---------|---------|
| `supabase.auth.signInWithPassword` | POST | Login | `{ email, password }` |
| `supabase.auth.signUp` | POST | Login | `{ email, password }` |
| `supabase.auth.signOut` | POST | Sidebar/AppShell | — |
| `supabase.auth.getSession` | GET | client.ts interceptor | — |
| `/users/{id}` | GET | Dashboard, Settings | — |
| `/users/{id}` | PATCH | Onboarding, Settings | `{ business_name, industry, services, auto_reply_enabled, ... }` |
| `/analytics` | GET | Dashboard, Analytics | — |
| `/sessions` | GET | Dashboard | — |
| `/sessions` | POST | QRScanner | `{}` |
| `/sessions/{id}/status` | GET | QRScanner (2s poll) | — |
| `/sessions/{id}` | DELETE | Settings | — |
| `/conversations` | GET | Conversations | — |
| `/conversations/{id}/messages` | GET | Conversations | — |
| `/conversations/{id}` | PATCH | Conversations | `{ ai_paused }` |
| `/conversations/{id}/messages` | POST | Conversations | `{ content }` |
| `/leads` | GET | Leads | — |
| `/leads/{id}` | PATCH | Leads | `{ stage }` |
| `/tasks` | GET | Tasks, Dashboard, Appointments | — |
| `/tasks` | POST | Appointments | `{ title, due_date, is_completed }` |
| `/tasks/{id}` | PATCH | Tasks, Appointments | `{ is_completed }` |
| `/tasks/{id}` | DELETE | Appointments | — |
| `/schema` | GET | AIBrain | — |
| `/schema` | PATCH | AIBrain | `{ schema }` |
| `/catalog` | GET | InventoryTable | `?page=&limit=&status=&sort=&search=` |
| `/catalog` | POST | ItemModal | `{ item_name, category, price, quantity, attributes }` |
| `/catalog/{id}` | PATCH | ItemModal | `{ ... }` |
| `/catalog/{id}` | DELETE | InventoryTable | — |
| `/catalog/{id}/sold` | PATCH | InventoryTable | — |
| `/catalog/stats` | GET | AIBrain | — |
| `/catalog/export` | GET | AIBrain | `?type=xlsx` (blob response) |
| `/knowledge` | GET | AIBrain, KnowledgeBase | — |
| `/knowledge` | POST | AIBrain, KnowledgeBase | `{ content }` |
| `/knowledge/{id}` | DELETE | AIBrain, KnowledgeBase | — |
| `/files/upload` | POST | FileUpload | `multipart/form-data` |
| `/files/{id}/process` | POST | FileUpload | `{ columnMapping, rows }` |
