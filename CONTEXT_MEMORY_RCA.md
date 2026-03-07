# Linde AI Agent — Context / Memory Handling
## Deep Root Cause Analysis (RCA)

**Date:** 7 July 2025
**Scope:** Why follow-up queries like "also N2" sometimes return incorrect products (e.g. N2 + H2 instead of only N2)
**Status:** Analysis only — no fixes implemented yet

---

## Problem Statement

In a multi-turn conversation:
1. User asks for **O2 datasheet**
2. User asks for **H2 datasheet**
3. User says **"also N2"**

**Expected:** Only N2 datasheet returned (the new incremental addition).
**Actual (intermittent):** N2 + H2 returned, or N2 + O2, or all three — i.e. stale entities from prior turns leak into the current response.

---

## Architecture Overview (as-is)

```
Frontend (useChat.ts)
  |  sends: { message, sessionId }
  |  (NO conversation history in body - memory is server-side)
  v
n8n Webhook ("On GET request1")
  v
Intent Agent  <-- Memory Buffer Window (contextWindowLength: 10, keyed by sessionId)
  |  LLM: gpt-4o-mini, temp 0.3
  |  Output: JSON { intent, intents, entities: { gas, gases }, intent_product_map, confidence }
  v
downstream node (Code)
  |  Parses/normalizes Intent Agent output
  |  Extracts gasesNorm[], chunks count, intentProductMap
  v
Confidence Gate (>= 0.6)
  v
Multi-Intent Check --> if true --> Multi path (DS chunks + QT chunks + Build Multi Response)
                   --> if false --> Switch --> intent-specific pipeline (PDS / Quotation / Delivery / etc.)
```

Key architectural fact: **the frontend sends ONLY the current message**. All conversational context comes from n8n's `memoryBufferWindow` nodes attached to each agent.

---

## Section 1: Observed Risk Areas

### 1.1 Intent Agent + Memory (THE PRIMARY RISK)

| Component | Risk |
|-----------|------|
| **Memory - Intent Agent** | `contextWindowLength: 10` — stores last 10 turns of conversation. When user says "also N2", the LLM sees prior turns where O2 and H2 were discussed. |
| **Intent Agent system prompt** | Has NO instruction about how to handle **incremental follow-up** queries. The prompt says "populate entities.gases with ALL detected gas names" — but never clarifies whether "all" means _all from the current message only_ or _all from memory + current message_. |
| **LLM interpretation of "also N2"** | With 10 turns of memory, the LLM may interpret "also N2" as "add N2 to the previous gases" and output `gases: ["H2", "N2"]` or even `gases: ["O2", "H2", "N2"]`, because it completes what makes conversational sense. |

### 1.2 downstream node (Code) — Entity Extraction

| Component | Risk |
|-----------|------|
| **Gas extraction** | Reads `entities.gases` from Intent Agent output. If Intent Agent already merged old gases, downstream has no way to filter them out. |
| **No "current-turn-only" filter** | downstream node never compares the current message against extracted gases to verify they are actually mentioned in the current turn. |
| **gasesNorm drives everything** | The entire pipeline (topK chunks, source filtering, response building) depends on `gasesNorm`. If it contains stale entries, everything downstream is polluted. |

### 1.3 Pinecone Retrieval (Vector Search)

| Component | Risk |
|-----------|------|
| **Search prompt** | Uses `$('On GET request1').item.json.body.message` — the raw user message. So for "also N2", the Pinecone query is literally "also N2" — which may return N2 chunks but could also return H2 or O2 chunks due to semantic similarity (all gas datasheets share similar structure). |
| **topK calculation** | `Math.min(20, Math.max(4, uniqueGases.length * 4))` — if gasesNorm contains 2 gases due to memory leak, topK = 8 instead of 4, pulling more irrelevant chunks. |

### 1.4 Source Filtering (Respond with attachment1)

| Component | Risk |
|-----------|------|
| **gasesNorm from downstream** | The response node reads gasesNorm from downstream node to filter Pinecone chunks by filename match. If `gasesNorm = ["Nitrogen", "Hydrogen"]` (memory leak), both N2 and H2 files will pass the filter. |
| **No independent verification** | Never cross-checks whether the user's current message actually mentions H2. |

### 1.5 Multi-Intent Path

| Component | Risk |
|-----------|------|
| **intentProductMap** | If Intent Agent outputs `intentProductMap: { datasheet: ["H2", "N2"] }` due to memory, the multi-intent path will search for both. |
| **Extract DS Sources / Build Multi Response** | Both code nodes trust intentProductMap and gasesNorm blindly from downstream. |

### 1.6 Memory Distribution Across Agents

| Agent | Memory Window | Shared Session Key | Risk Level |
|-------|--------------|-------------------|------------|
| Intent Agent | 10 turns | sessionId | **HIGH** — sees full conversation history; can over-extract entities |
| Greeting Agent | 10 turns | same sessionId | Low — no entity extraction |
| Quotation Agent | 10 turns | same sessionId | Medium — may reference wrong gas from prior quote |
| Calendar Agent | 10 turns | same sessionId | Low — appointment context |
| Delivery Agent | **2 turns** | same sessionId | Low — deliberately limited |
| General Agent | 10 turns | same sessionId | Low |
| Availability Agent | 10 turns | same sessionId | Medium |

**Critical observation:** ALL agents share the **same sessionId** key for their memory buffers. However, agents are on **different branches** of the Switch node, so their memory stores are typically independent (each memoryBufferWindow stores its own chat history per node-session pair). The real problem is concentrated in the **Intent Agent** which sees ALL turns regardless of intent.

---

## Section 2: Most Likely Root Causes (Ranked)

### ROOT CAUSE #1 (HIGHEST PROBABILITY) — Intent Agent Prompt Lacks Co-Reference Resolution Rules

**What happens step by step:**
1. Turn 1: User says "datasheet for O2" -> Intent Agent (no memory yet) -> `gases: ["O2"]` ✅
2. Turn 2: User says "H2 ka datasheet" -> Intent Agent sees memory: Turn 1 was O2. Current is H2. -> `gases: ["H2"]` (usually correct, but sometimes `["O2","H2"]`)
3. Turn 3: User says "also N2" -> Intent Agent sees memory: Turn 1=O2, Turn 2=H2. Current is "also N2". LLM interprets "also" as _"in addition to what we have been discussing"_ -> `gases: ["H2", "N2"]` or `["O2", "H2", "N2"]`

**Why this is non-deterministic:**
- GPT-4o-mini is a probabilistic model. Even with temperature=0.3, there IS randomness.
- The word "also" is inherently ambiguous — does it mean "in addition to the last query" or "in addition to all previous queries"?
- The system prompt says _"populate entities.gases with ALL detected gas names/symbols"_ — from the LLM's perspective with memory context, O2 and H2 ARE "detected" (they appear in memory).

**Evidence in the prompt:**
The Intent Agent system prompt has this instruction:

> **MULTI-GAS DATASHEET**: If the user requests datasheets/info for multiple gases (e.g. "O2, H2, N2" or "Oxygen and Nitrogen"), populate entities.gases with ALL detected gas names/symbols.

The words **"ALL detected"** without the qualifier **"in the current message only"** is the root cause. With 10 turns of memory visible, the LLM "detects" historical gases too.

**Probability:** ~70% that this explains the observed behavior.

---

### ROOT CAUSE #2 (HIGH PROBABILITY) — No "Current Turn Extraction" Guardrail in downstream node

The downstream node code does:
```javascript
const gasesRaw = Array.isArray(e.gases) && e.gases.length > 0
  ? e.gases
  : (gasRaw ? [gasRaw] : []);
```

It trusts whatever Intent Agent returned. There is **no secondary validation** like:
- "Check if each gas in gases[] actually appears in the user's current message"
- "If a gas only exists in memory but not the current message, exclude it"

This means if Intent Agent leaks H2 from memory into gases[], downstream propagates it unchallenged throughout the entire pipeline.

**Probability:** This is an _amplifier_ of Root Cause #1. If #1 is fixed, #2 becomes irrelevant. But as a defense layer, its absence is a root cause.

---

### ROOT CAUSE #3 (MEDIUM PROBABILITY) — Memory Stores Previous AI Responses (Not Just User Messages)

n8n's `memoryBufferWindow` stores both **input** and **output** for each turn. This means the Intent Agent's memory contains:

```
Human: "datasheet for O2"
AI: { "intent": "datasheet", "entities": { "gas": "O2", "gases": ["O2"] }, "confidence": 0.95 }
Human: "H2 ka datasheet"
AI: { "intent": "datasheet", "entities": { "gas": "H2", "gases": ["H2"] }, "confidence": 0.92 }
```

Now when Turn 3 ("also N2") arrives, the LLM sees **explicit structured JSON** mentioning `"O2"` and `"H2"` as entities in prior AI responses. This STRONGLY reinforces the pattern of including those gases in the current extraction — the LLM sees its own prior extractions and pattern-matches.

**This is worse than simple conversational carryover.** The AI sees its own previous JSON outputs with `gases: ["O2"]` and `gases: ["H2"]` and may think it needs to **accumulate** them. This is a n8n memory architecture issue — ideally only human messages should be in the context, or the AI responses should be summarized rather than raw JSON.

**Probability:** ~50% contributor (amplifies Root Cause #1 significantly).

---

### ROOT CAUSE #4 (MEDIUM PROBABILITY) — Pinecone Semantic Similarity Returns Off-Target Chunks

When user says "also N2", the Pinecone search prompt is literally `"also N2"`. This is a very short, low-signal query.

- All gas datasheets share similar document structure (safety sections, physical properties, etc.)
- Embedding similarity between "also N2" and H2/O2 datasheets may be high
- With an inflated topK (from Root Cause #1 -> #2 pipeline), more off-target chunks are retrieved

Even if this alone would not cause the bug (the gas filter should catch it), combined with an over-inclusive gasesNorm, it creates a compounding failure.

**Probability:** ~30% contributor (only materializes when Root Causes #1 + #2 also fail).

---

### ROOT CAUSE #5 (LOWER PROBABILITY) — No Incremental vs. Absolute Request Distinction

The system has **no concept** of:
- **Incremental request**: "also N2" = add N2 to the ongoing conversation
- **Absolute request**: "now show me N2" = replace/reset, only show N2
- **Cumulative request**: "show me all three" = explicitly show O2 + H2 + N2

Every request is treated as **absolute** at the pipeline level (single extraction -> single response), but the Intent Agent's memory makes it behave as **cumulative** non-deterministically.

There is no metadata passed through the pipeline indicating whether the user's intent is additive, replacement, or cumulative. This fundamental design gap means even a "correct" extraction can produce wrong behavior depending on what the user actually meant.

**Probability:** ~20% as a direct cause, but 100% as a design gap that needs to be addressed for robust multi-turn behavior.

---

### ROOT CAUSE #6 (LOWER PROBABILITY) — LLM Non-Determinism (Temperature 0.3)

GPT-4o-mini at temperature=0.3 is **not deterministic**. The same conversation history + same message can produce different entity extractions across runs:

- Run A: `gases: ["N2"]` (correct — LLM focused on current message)
- Run B: `gases: ["H2", "N2"]` (incorrect — LLM merged from memory)

This explains why the bug is **intermittent**. It is not a logic bug in the code — the code faithfully propagates whatever the LLM returns. The issue is that the LLM's output is **under-constrained** by the prompt.

**Probability:** ~100% as an explanation for intermittency, but the root fix is in the prompt (Root Cause #1), not in temperature tuning.

---

### ROOT CAUSE #7 (EDGE CASE) — gasesNorm Empty = Return ALL Sources

In the `Respond with attachment1` node:
```javascript
if (gasesNorm.length === 0) {
  // return ALL candidates
}
```

If the Intent Agent returns an empty gases array (edge case with low confidence or malformed output), ALL Pinecone chunks are returned unfiltered. This could surface irrelevant datasheets.

**Probability:** ~5% (only triggers on malformed Intent Agent output).

---

## Section 3: Recommended Fix Strategy (High Level)

### FIX 1 (CRITICAL) — Rewrite Intent Agent System Prompt for Follow-Up Awareness

**Goal:** Teach the LLM to distinguish between "current turn entities" and "conversation history entities."

**Approach:**
- Add explicit rules to the system prompt:
  - "Extract entities ONLY from the user's CURRENT message"
  - "Do NOT carry forward entities from previous turns unless the user explicitly re-references them"
  - "Words like 'also', 'same for', 'what about' refer to the intent/action, not to accumulating all previous products"
- Add examples of correct follow-up handling:
  - User history: O2 -> H2 -> "also N2" => `gases: ["N2"]` (NOT ["H2", "N2"])
  - User: "show me O2 and H2" => `gases: ["O2", "H2"]`
  - User: "same for Argon" => `gases: ["Ar"]`

**Impact:** Directly addresses Root Causes #1, #3, #6.

---

### FIX 2 (HIGH PRIORITY) — Add Current-Message Validation in downstream node

**Goal:** Even if the LLM makes a mistake, catch it before it propagates.

**Approach:**
- In the downstream node code, cross-check each gas in `gases[]` against the raw `body.message`
- If a gas (or its alias) does NOT appear in the current message AND the message contains context words like "also", "same for", "what about", flag it as potentially leaked from memory
- Option A: Strip leaked gases entirely
- Option B: Add a `isFromMemory: true` flag for downstream nodes to handle

**Impact:** Defense-in-depth layer for Root Cause #2.

---

### FIX 3 (MEDIUM PRIORITY) — Enrich Pinecone Query with Resolved Entity

**Goal:** Make the vector search more targeted for follow-up queries.

**Approach:**
- Instead of sending raw `body.message` ("also N2") to Pinecone, construct a richer query:
  - `"Nitrogen N2 gas datasheet product data sheet"` (derived from gasesNorm)
- This gives Pinecone a stronger semantic signal, reducing off-target chunk retrieval

**Impact:** Addresses Root Cause #4.

---

### FIX 4 (MEDIUM PRIORITY) — Reduce Intent Agent Memory Window or Filter It

**Goal:** Reduce the amount of historical context that can confuse entity extraction.

**Approach options:**
- **Option A:** Reduce `contextWindowLength` from 10 to 3-4 turns for the Intent Agent specifically (other agents can keep 10)
- **Option B:** Keep 10 turns but modify the memory to store only human messages (not AI JSON responses) — this may require a custom memory node or post-processing
- **Option C:** Add a summarization step that converts raw memory into a concise "conversation context" string before feeding to Intent Agent

**Impact:** Addresses Root Causes #1, #3.

---

### FIX 5 (LOWER PRIORITY) — Add Incremental/Absolute Intent Classification

**Goal:** Let the system understand whether a follow-up is additive, replacement, or cumulative.

**Approach:**
- Add a new field to Intent Agent output: `context_mode: "new" | "additive" | "cumulative"`
  - `"new"`: Fresh request, no relation to previous ("Show me Argon datasheet")
  - `"additive"`: Add to previous ("also N2") — return ONLY the new product
  - `"cumulative"`: Show all so far ("show me all of them") — return accumulated products
- downstream node and response builder use `context_mode` to decide behavior

**Impact:** Addresses Root Cause #5.

---

### FIX 6 (QUICK WIN) — Set Temperature to 0

**Goal:** Reduce non-deterministic behavior in entity extraction.

**Approach:**
- Change Intent Agent LLM temperature from 0.3 to 0 (or as close to 0 as the API allows)
- This won't eliminate the problem but will make it more reproducible for debugging and less surprising for users

**Impact:** Partially addresses Root Cause #6.

---

## Summary: Root Cause Priority Matrix

| Rank | Root Cause | Probability | Fix Priority | Fix Complexity |
|------|-----------|-------------|-------------|----------------|
| 1 | Intent Agent prompt lacks co-reference rules | **~70%** | **CRITICAL** | Low (prompt change only) |
| 2 | No current-turn validation in downstream node | Amplifier | **HIGH** | Medium (code change) |
| 3 | Memory stores raw AI JSON responses | **~50%** | **MEDIUM** | Medium-High (memory architecture) |
| 4 | Pinecone low-signal query for follow-ups | **~30%** | **MEDIUM** | Low (query enrichment) |
| 5 | No incremental/absolute distinction | **~20%** | **MEDIUM** | Medium (new classification field) |
| 6 | LLM non-determinism at temp 0.3 | **~100% for intermittency** | **QUICK WIN** | Trivial (config change) |
| 7 | gasesNorm empty = return all | **~5%** | **LOW** | Low (add fallback logic) |

## Recommended Fix Order

1. **Fix 6** (set temp to 0) — 2 minutes, immediate improvement in consistency
2. **Fix 1** (rewrite Intent Agent prompt) — 30 minutes, directly tackles the #1 root cause
3. **Fix 2** (downstream validation) — 1 hour, defense-in-depth safety net
4. **Fix 3** (enrich Pinecone query) — 30 minutes, better retrieval for follow-ups
5. **Fix 4** (reduce/filter memory) — 1-2 hours depending on approach
6. **Fix 5** (context_mode classification) — 2 hours, best long-term solution

---

*End of RCA. Fixes will be implemented step by step after review.*
