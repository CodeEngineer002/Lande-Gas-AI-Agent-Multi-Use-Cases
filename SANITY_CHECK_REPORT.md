# Sanity Check Report — Linde Gas AI Agent System

**Date:** 7 March 2026  
**Scope:** End-to-end technical & product-level review  
**Status:** Review only — no changes implemented

---

## System Overview

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14.2.3, React 18, TypeScript, Framer Motion, Tailwind | Chat UI, document cards, delivery tracking, settings |
| API Proxy | Next.js API routes (`/api/chat`, `/api/download`, `/api/email-tracking`) | Security boundary, payload sanitization, n8n proxying |
| Orchestration | n8n (self-hosted at `n8n.acngva.com`) | Intent routing, RAG retrieval, response composition, email/calendar actions |
| LLM | Azure OpenAI `gpt-4o-mini` | Intent classification, response generation, entity extraction |
| Embeddings | Azure OpenAI `text-embedding-3-large` (3072 dim) | Document embeddings for RAG |
| Vector DB | Pinecone (`pinecode-vector-db-embedding-large-3072`) | Datasheet & quotation document retrieval |
| Structured Data | Google Sheets | Delivery status, product availability |
| File Storage | Google Drive | PDF datasheets, quotation documents |
| Actions | Gmail, Google Calendar | Email sending, appointment scheduling |

### Supported Intents

| Intent | Data Source | Response Type |
|---|---|---|
| `datasheet` | Pinecone RAG | Document card(s) + natural language |
| `quotation` | Pinecone RAG | Document card(s) + pricing summary |
| `delivery_update` | Google Sheets | Structured tracking card |
| `availability` | Google Sheets | Availability summary |
| `appointment` | Google Calendar | Confirmation card or clarification form |
| `greeting` | LLM only | Warm greeting |
| `smalltalk` | LLM only | Brief response |

---

## 1. What Looks Good

### 1.1 Architecture

- **Clean proxy layer:** Frontend never talks to n8n directly. Next.js API routes act as a security and normalization boundary. Even if n8n returns unexpected shapes, the client always receives a valid JSON contract.
- **Strict response contract:** `{ response_message, sources[], meta }` is enforced consistently across all 7+ n8n response branches AND sanitized in the API route's response parser (`app/api/chat/route.ts` lines 119–169).
- **Session propagation:** Session ID generated client-side, forwarded through API to n8n for conversation memory — clean and stateless on the server side.

### 1.2 Intent Routing & AI Logic

- **Confidence gating (≥0.6):** Low-confidence classifications are rejected with a clarification prompt instead of being routed to the wrong agent. Good guard against hallucinations.
- **Multi-intent support:** The `intentProductMap` + `"ALL"` keyword system handles complex queries like "send me all datasheets and a quotation for Nitrogen" — well-engineered for an n8n-based system.
- **Specialized agents:** Each intent branch has a focused system prompt (Greeting Agent, Quotation Agent, Delivery Status Agent, etc.), preventing prompt pollution across domains.
- **Dynamic topK boost:** Pinecone retrieval budget scales automatically — 4 chunks per gas (capped at 20), or 20 when `ALL` is used.

### 1.3 Frontend UX

- **Smart client-side fallbacks:** `useChat` hook does keyword-based intent coercion and regex-based `extractDeliveryData()` as safety nets when n8n misclassifies or omits structured data.
- **Rich response rendering:** Document cards auto-hide for non-document intents (`NO_CHIP_TYPES`), delivery tracking has fuzzy status matching, appointment clarification validates required fields.
- **Complete download flow:** Single-file direct download, multi-file email, and ZIP-all feature cover all user scenarios. Server-side proxying keeps file URLs private.
- **Response format flexibility:** Users can toggle between natural language, structured cards, or both — appropriate for enterprise users with varying preferences.
- **Transparency panel:** Right sidebar with confidence meter, source citations, quick prompts, and contextual actions provides the visibility enterprise users expect.

### 1.4 n8n Workflow

- **Clean routing pattern:** Intent Agent → downstream parser → confidence gate → switch → specialized agent → typed response node.
- **Source deduplication:** `Extract DS Sources` deduplicates by filename, preventing duplicate document cards.
- **Multi-intent merge:** `Build Multi Response` correctly merges datasheet + quotation sources with per-intent gas filtering.

---

## 2. Potential Issues

### 2.1 Critical

| ID | Area | Issue | Impact |
|---|---|---|---|
| **C1** | Security | **Webhook endpoints are unauthenticated.** `ARCHITECTURE.md` claims "BasicAuth on webhook" but no authentication is configured on `chat-with-linde-ai-agent` or `download-linde-pdf-api`. Anyone with the URL can call them directly. | External abuse, data exfiltration, API cost inflation |
| **C2** | Data | **Availability Sheet ID is a placeholder.** The Availability Agent's Google Sheet credential is still `"YOUR_AVAILABILITY_SHEET_ID"`. The availability intent will fail at runtime. | Feature broken in production |
| **C3** | Code quality | **Dead `eval()` in AppointmentClarificationCard.** Gated by `&& false` so never executes, but static analysis tools will flag it and it's a security smell. | Audit/compliance risk |

### 2.2 Moderate

| ID | Area | Issue | Impact |
|---|---|---|---|
| **M1** | Data consistency | **GAS_ALIASES defined 3 times with inconsistencies.** Instance A (single-intent) maps `'Carbon Dioxide': ['carbon_dioxide', 'carbon dioxide', 'co2']`. Instances B/C (multi-intent) map `'carbon dioxide': ['CO2']` only — missing `'Carbon Dioxide'` and `'Carbon_Dioxide'` as terms. Files named `Carbon_Dioxide_TDS.pdf` will match in single-intent but **silently fail** in multi-intent. | Silent document omission |
| **M2** | Fragile coupling | **`file_url` is overloaded.** For documents it's a Google Drive URL; for appointments it's repurposed as the Google Meet link (via `utils.ts`). If an appointment response ever includes both a Meet link AND a document source, behavior is unpredictable. | Potential wrong URL opened |
| **M3** | Session | **Session ID not persisted.** Generated fresh on every page load — a page refresh loses all conversation context. Enterprise users expect continuity. | Context loss on refresh |
| **M4** | Hardcoded | **`USER_NAME = 'Prateek Bais'` in MessageBubble.tsx.** Every user sees this name displayed as their identity. | Wrong identity shown |
| **M5** | Reliability | **No rate limiting on API routes.** 90s timeout on n8n calls means a single user can hold a connection for 90 seconds. Under load, connection pools can be exhausted. | Potential DoS |
| **M6** | Download gating | **Content-Type check too restrictive.** Download API only accepts `pdf|octet-stream|binary`. DOCX or XLS files (which `SourceChips` visually supports) will be rejected with "Download not available." | Non-PDF downloads broken |

### 2.3 Low

| ID | Area | Issue | Impact |
|---|---|---|---|
| **L1** | UX polish | **`window.prompt()` for email input.** Functional but jarring in a polished enterprise UI. | Inconsistent UX feel |
| **L2** | UX clarity | **Partial ZIP success messaging is confusing.** If 3 of 5 files download, user gets an error toast ("Downloaded 3 of 5") but the ZIP still saves with 3 files. | User confusion |
| **L3** | Reliability | **No retry in ZIP download.** Failed individual file fetches aren't retried. Transient errors permanently exclude files. | Missing files in ZIP |
| **L4** | Maintenance | **GAS_ALIASES + helpers copy-pasted in 2 n8n nodes.** Adding a new gas requires editing 3 places (single-intent node + 2 multi-intent nodes). | Maintenance burden |
| **L5** | Type safety | **Intent naming mismatch.** PRD defines `delivery_update`; frontend `IntentType` includes both `delivery_update` AND `delivery_status`. Client-side coercion bridges the gap but it's an implicit contract. | Fragile implicit mapping |

---

## 3. Suggested Improvements

### 3.1 Security (Priority: High)

| # | Suggestion | Effort |
|---|---|---|
| S1 | **Add webhook authentication** — Enable n8n's built-in Header Auth or BasicAuth on all webhook nodes. Update API routes to send the auth header. | Low |
| S2 | **Add rate limiting** — Use Vercel's rate limiting or a simple in-memory token bucket on '/api/chat' and '/api/download'. | Low |
| S3 | **Remove dead `eval()`** — Delete the unused eval expression in AppointmentClarificationCard. | Trivial |

### 3.2 Architecture (Priority: Medium)

| # | Suggestion | Effort |
|---|---|---|
| S4 | **Centralize GAS_ALIASES** — Move the gas normalization map to a single n8n Code node (or a Google Sheet) that all downstream nodes reference. Eliminates 3-way duplication. | Medium |
| S5 | **Separate `meetLink` from `file_url`** — Add a dedicated `meet_link` field to the appointment response contract and the frontend `AppointmentData` type. | Low |
| S6 | **n8n sub-workflows** — Extract each intent pipeline into its own sub-workflow as intents grow. The current monolithic workflow will become hard to debug. | Medium |
| S7 | **Widen Content-Type acceptance** — Accept DOCX, XLSX, CSV MIME types in the download API, not just PDF/octet-stream. | Trivial |

### 3.3 Scalability (Priority: Medium)

| # | Suggestion | Effort |
|---|---|---|
| S8 | **Configurable gas catalog** — Move the gas list to a Google Sheet or environment config so new products require zero code changes. | Medium |
| S9 | **Session persistence** — Store `sessionId` in localStorage so page refreshes don't lose conversation context. | Low |
| S10 | **Normalize intent naming** — Align PRD, n8n workflow, and frontend on a single intent vocabulary. Remove the client-side coercion workaround. | Low |

### 3.4 Reliability (Priority: Medium)

| # | Suggestion | Effort |
|---|---|---|
| S11 | **Add retry logic** — Single retry with backoff for n8n webhook calls in the chat API route. | Low |
| S12 | **Fix Availability Sheet ID** — Configure the real Google Sheet credential before the availability intent goes live. | Trivial |
| S13 | **Retry failed ZIP file downloads** — Add 1 retry per file in `startDownloadAll` before marking as failed. | Low |

### 3.5 UX Polish (Priority: Low)

| # | Suggestion | Effort |
|---|---|---|
| S14 | **Dynamic user identity** — Replace hardcoded `USER_NAME` with a value from settings or a lightweight auth context. | Low |
| S15 | **Replace `window.prompt` with modal** — Use a styled modal component for email input to match the rest of the UI. | Low |
| S16 | **Clearer partial ZIP messaging** — Distinguish between "ZIP downloaded (3 of 5 files)" as a warning vs. total failure as an error. | Trivial |

---

## 4. Verdict

| Dimension | Rating | Notes |
|---|---|---|
| Architecture | **Good** | Clean layered design, consistent contracts, proper separation of concerns |
| AI / Agent Logic | **Good** | Robust intent routing, confidence gating, multi-intent support |
| n8n Workflows | **Good with caveats** | Works well but has code duplication and one placeholder credential |
| Frontend UX | **Good** | Polished enterprise UI with smart fallbacks and rich components |
| Backend / API | **Good** | Solid proxy layer with sanitization, but missing auth and rate limiting |
| Scalability | **Moderate** | Current design works for ~10 gases / 7 intents. Needs centralized config for growth |
| Security | **Needs attention** | Unauthenticated webhooks are the biggest gap. Must be fixed before production. |

### Overall Assessment

The system is **logically sound and well-designed as a product**. The architecture, data flow, and UX all make sense end-to-end. The main risks are:
1. **Unauthenticated webhooks** (critical security gap)
2. **GAS_ALIASES duplication** (will cause bugs when adding gases)
3. **Placeholder credentials** (availability feature broken)

None of these are structural — they're all fixable without redesigning the system.

---

*Report generated from codebase analysis. No changes were implemented.*
