# Linde Gas AI Agent — Complete Implementation Plan

**Role:** Lead AI Systems Engineer  
**Source of Truth:** prd.md  
**Constraint:** No new intents. No response contract changes. No hallucinations.

---

## PART 1 — HIGH-LEVEL IMPLEMENTATION BREAKDOWN

### Phase 0 — Infrastructure Setup (Day 0–1)
- Provision n8n instance (self-hosted or n8n Cloud)
- Configure Azure OpenAI: `gpt-4o-mini` + `text-embedding-3-large`
- Connect Pinecone indexes
- Connect Google Workspace (Drive, Sheets, Gmail, Calendar)
- Configure BasicAuth on all webhooks

### Phase 1 — Intent Routing Layer (Day 1)
- Build Intent Agent node (Azure OpenAI)
- Build Entity Normalization node
- Build Switch Router (7 branches)

### Phase 2 — RAG Flows (Day 2–3)
- UC1: Datasheet RAG (Pinecone `pinecode-vector-db-embedding-large-3072`)
- UC3: Quotation RAG (Pinecone `quotation-linde-large-3072`)
- UC5: Technical Advice (reuses UC1 Pinecone flow)

### Phase 3 — Structured Data Flows (Day 3–4)
- UC2: Delivery Status (Google Sheets)
- UC4: Availability (Google Sheets)

### Phase 4 — Action Flows (Day 4–5)
- UC6: Appointment (Google Calendar + Gmail)
- Email trigger across all UCs (download-pdf-api)
- Greeting/Smalltalk handler

### Phase 5 — Response Composer + JSON Contract Enforcement (Day 5)
- Merge all branch outputs into unified JSON contract
- Add input/output validation node

### Phase 6 — Testing + Hardening (Day 6–7)
- Per-UC test suite
- Error injection testing
- Confidence threshold routing tests
- Deployment checklist validation

---

## PART 2 — DEEP TECHNICAL WORKFLOW PLAN

---

### 2.1 Main Webhook — `/chat-with-pdf-api`

**Node Type:** Webhook (POST)  
**Auth:** BasicAuth  
**Input Schema:**
```json
{
  "message": "string",
  "email": "optional string"
}
```

**Validation (Code Node immediately after webhook):**
```javascript
const body = $input.first().json.body;
if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
  throw new Error('VALIDATION_ERROR: message is required and must be a non-empty string');
}
// Pass-through email (can be null)
return [{
  json: {
    message: body.message.trim(),
    email: body.email || null
  }
}];
```

---

### 2.2 Intent Agent Node

**Node Type:** Azure OpenAI Chat (HTTP Request or LangChain Agent)  
**Model:** `gpt-4o-mini`  
**System Prompt:**
```
You are an intent router for Linde Gas AI Assistant.
Return STRICT JSON only. No extra text. No markdown.

Supported intents: datasheet, quotation, delivery_update, availability, appointment, greeting, smalltalk

Output format:
{
  "intent": "<one of supported intents>",
  "confidence": <0.0 to 1.0>,
  "entities": {
    "gas": "<string or null>",
    "purity": "<string or null>",
    "sheet_type": "<PDS|SDS|MSDS|TDS|null>",
    "order_id": "<string or null>",
    "quantity": "<number or null>",
    "location": "<string or null>",
    "account_no": "<string or null>",
    "preferred_date": "<ISO date or null>",
    "preferred_time": "<HH:MM or null>",
    "duration_minutes": "<number or null>",
    "attendee_emails": ["<email>"],
    "platform": "<Meet|Teams|null>"
  }
}
```

**User Message Format:**  
`User message: {{$json.message}}`

**Output Parsing (Code Node):**
```javascript
let raw = $input.first().json.choices[0].message.content;
// Strip markdown code fences if present
raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
let parsed;
try {
  parsed = JSON.parse(raw);
} catch(e) {
  throw new Error('INTENT_PARSE_ERROR: LLM returned invalid JSON: ' + raw);
}
const VALID_INTENTS = ['datasheet','quotation','delivery_update','availability','appointment','greeting','smalltalk'];
if (!VALID_INTENTS.includes(parsed.intent)) {
  parsed.intent = 'smalltalk';
  parsed.confidence = 0.0;
}
return [{ json: { ...parsed, original_message: $('Webhook').first().json.body.message, email: $('Webhook').first().json.body.email || null } }];
```

---

### 2.3 Confidence Gate Node (Code Node)

```javascript
const confidence = $input.first().json.confidence;
const intent = $input.first().json.intent;
if (confidence < 0.6) {
  return [{
    json: {
      __route: 'clarification',
      response_message: "I'm not sure I understood your request. Could you please clarify? I can help with datasheets, quotations, delivery status, product availability, or scheduling a meeting.",
      sources: []
    }
  }];
}
return [{ json: { ...$input.first().json, __route: intent } }];
```

---

### 2.4 Switch Router

**Node Type:** Switch  
**Route on:** `$json.__route`

| Value | Branch |
|---|---|
| `datasheet` | RAG Datasheet Flow |
| `quotation` | RAG Quotation Flow |
| `delivery_update` | Delivery Sheet Flow |
| `availability` | Availability Sheet Flow |
| `appointment` | Calendar Agent Flow |
| `greeting` | Greeting Flow |
| `smalltalk` | Smalltalk Flow |
| `clarification` | Direct Response (skip to composer) |
| `out_of_domain` | Scoped Rejection Response |

---

### 2.5 UC1 — Datasheet RAG Flow

#### Step 1: Embed User Message
**Node:** Azure OpenAI Embeddings (HTTP Request)
```
POST https://<AZURE_ENDPOINT>/openai/deployments/text-embedding-3-large/embeddings?api-version=2024-02-01
Body: { "input": "{{$json.original_message}}" }
Header: api-key: {{$env.AZURE_OPENAI_KEY}}
```

#### Step 2: Query Pinecone
**Node:** HTTP Request (POST)
```
POST https://{{$env.PINECONE_BASE_URL}}/query
Header: Api-Key: {{$env.PINECONE_API_KEY}}
Body:
{
  "vector": <embedding from step 1>,
  "topK": 4,
  "includeMetadata": true,
  "namespace": ""
}
Index: pinecode-vector-db-embedding-large-3072
```

#### Step 3: Context Assembly (Code Node)
```javascript
const matches = $input.first().json.matches || [];
if (matches.length === 0) {
  return [{
    json: {
      context: '',
      sources: [],
      __no_context: true
    }
  }];
}
const context = matches.map(m => m.metadata.text || m.metadata.content || '').join('\n\n---\n\n');
const sources = matches.map(m => ({
  doc_id: m.id,
  title: m.metadata.filename || m.metadata.title || 'Linde Datasheet',
  file_url: m.metadata.file_url || m.metadata.source || '',
  type: 'datasheet'
}));
return [{ json: { context, sources, __no_context: false } }];
```

#### Step 4: No-Context Guard
**Node:** IF  
Condition: `$json.__no_context === true`  
True branch → return:
```json
{
  "response_message": "I could not find relevant data sheets for your query. Please provide more details such as gas name, purity grade, or document type.",
  "sources": []
}
```

#### Step 5: LLM Answer Generation
**Node:** Azure OpenAI Chat  
**System Prompt:**
```
You are Linde Gas AI Assistant.
Answer ONLY using the provided context below. Do not use external knowledge.
Preserve all numbers, CAS numbers, purity values, and technical specs exactly.
If the answer is not present in the context, say: "Information not found in the data sheets."
Do not make assumptions.
```
**User Message:**
```
Context:
{{$json.context}}

Question: {{$('Intent Agent').first().json.original_message}}
```

#### Step 6: Response Composer
```javascript
const answer = $input.first().json.choices[0].message.content;
const sources = $('Context Assembly').first().json.sources;
return [{
  json: {
    response_message: answer,
    sources: sources
  }
}];
```

#### Step 7: Email Check
**Node:** IF — `$('Webhook').first().json.body.email !== null`  
True → trigger `download-pdf-api` via HTTP Request (internal) with `file_url` and email.

---

### 2.6 UC3 — Quotation RAG Flow

Same structure as UC1, with the following differences:

| Parameter | Datasheet | Quotation |
|---|---|---|
| Pinecone Index | `pinecode-vector-db-embedding-large-3072` | `quotation-linde-large-3072` |
| source `type` | `datasheet` | `quotation` |
| doc_id | from match | `price_doc` |
| LLM System Prompt | Datasheet prompt | Quotation prompt (below) |

**Quotation LLM System Prompt:**
```
You are a Quotation Agent for Linde Gas.
Using ONLY the retrieved pricing context below, compute:
- unit_price (with currency)
- quantity_based_discount (if stated)
- freight_estimate (if in doc)
- lead_time_days
- validity (default: 30 days from today unless doc states otherwise)

If critical data is missing (gas type, purity, or quantity), ask exactly ONE follow-up question.
Still provide an indicative price range if partial data exists.
Do not invent pricing. Do not use external knowledge.
Today's date: {{new Date().toISOString().split('T')[0]}}
```

**Output Contract for Quotation:**
```json
{
  "response_message": "string",
  "sources": [
    {
      "doc_id": "price_doc",
      "title": "Price_List_2025.pdf",
      "file_url": "string",
      "type": "quotation"
    }
  ]
}
```

**Entity extraction required before Pinecone query:**  
Build enriched query string:
```javascript
const e = $('Entity Normalize').first().json.entities;
const queryParts = [
  e.gas, e.purity, e.location, e.quantity ? `${e.quantity} units` : null
].filter(Boolean);
const enrichedQuery = queryParts.length > 0 ? queryParts.join(' ') : $json.original_message;
return [{ json: { enrichedQuery } }];
```

---

### 2.7 UC2 — Delivery Status Flow

#### Step 1: Extract Order ID
```javascript
const order_id = $input.first().json.entities.order_id;
if (!order_id) {
  return [{
    json: {
      __missing_order_id: true,
      response_message: "Please provide your order ID (e.g., LG-240001) to check delivery status.",
      sources: [{ doc_id: "delivery_doc", title: "Delivery Status Sheet", file_url: "", type: "delivery_update" }]
    }
  }];
}
return [{ json: { order_id: order_id.toUpperCase().trim(), __missing_order_id: false } }];
```

#### Step 2: Google Sheets Read
**Node:** Google Sheets (Read Rows)  
**Spreadsheet:** `{{$env.DELIVERY_SHEET_ID}}`  
**Sheet:** `Delivery_Status`  
**Operation:** Get All Rows

#### Step 3: Order Match (Code Node)
```javascript
const rows = $input.all().map(r => r.json);
const targetId = $('Extract Order ID').first().json.order_id;
let match = rows.find(r => r.order_id === targetId);
if (!match) {
  match = rows.find(r => r.order_id?.toUpperCase() === targetId.toUpperCase());
}
if (!match) {
  return [{
    json: {
      response_message: `Order ${targetId} was not found in our system. Please verify your order ID or contact your Linde representative.`,
      sources: [{ doc_id: "delivery_doc", title: "Delivery Status Sheet", file_url: "", type: "delivery_update" }]
    }
  }];
}
// Format response
const eta = match.eta_utc ? new Date(match.eta_utc).toDateString() : 'not yet confirmed';
const msg = `Order ${match.order_id} — ${match.product_name} (${match.grade_purity})\n` +
  `Status: ${match.current_status}\n` +
  `Detail: ${match.status_detail || 'N/A'}\n` +
  `ETA: ${eta}\n` +
  `Carrier: ${match.carrier || 'N/A'} | Tracking: ${match.tracking_no || 'N/A'}\n` +
  `Ship To: ${match.ship_to_city}, ${match.country}`;
return [{
  json: {
    response_message: msg,
    sources: [{ doc_id: "delivery_doc", title: "Delivery Status Sheet", file_url: "", type: "delivery_update" }]
  }
}];
```

**Required Sheet Columns (must match exactly):**
`order_id`, `product_name`, `product_code`, `grade_purity`, `quantity`, `unit`, `order_date_utc`, `promised_ship_date_utc`, `eta_utc`, `current_status`, `status_detail`, `po_number`, `customer_name`, `ship_to_city`, `country`, `carrier`, `tracking_no`, `ship_ready_utc`, `expected_arrival_utc`, `delivered_utc`, `received_by`

---

### 2.8 UC4 — Product Availability Flow

#### Step 1: Extract Entities
```javascript
const e = $input.first().json.entities;
const missing = [];
if (!e.gas) missing.push('product name');
if (missing.length > 0) {
  return [{
    json: {
      __ask_clarification: true,
      response_message: `Could you please specify: ${missing.join(', ')}?`,
      sources: []
    }
  }];
}
return [{
  json: {
    gas: e.gas?.toLowerCase().trim(),
    purity: e.purity?.toLowerCase().trim() || null,
    location: e.location?.toLowerCase().trim() || null,
    __ask_clarification: false
  }
}];
```

#### Step 2: Google Sheets Read
**Node:** Google Sheets (Read Rows)  
**Spreadsheet:** `{{$env.AVAILABILITY_SHEET_ID}}`  
**Sheet:** `Availability_Master`

#### Step 3: Match Logic (Code Node)
```javascript
const rows = $input.all().map(r => r.json);
const gas = $('Extract Availability Entities').first().json.gas;
const purity = $('Extract Availability Entities').first().json.purity;
const location = $('Extract Availability Entities').first().json.location;

let results = rows.filter(r => r.product_name?.toLowerCase().includes(gas));
if (purity) results = results.filter(r => r.grade_purity?.toLowerCase().includes(purity));
if (location) results = results.filter(r => r.location_dc?.toLowerCase().includes(location));

if (results.length === 0) {
  return [{
    json: {
      response_message: `No availability data found for ${gas}${purity ? ' ' + purity : ''}${location ? ' in ' + location : ''}. Please contact your Linde representative.`,
      sources: [{ doc_id: "availability_sheet", title: "Availability Master", file_url: "", type: "availability" }]
    }
  }];
}

const r = results[0];
const restock = r.next_restock_date ? `Next restock: ${r.next_restock_date}.` : '';
const msg = `${r.product_name} ${r.grade_purity || ''} at ${r.location_dc || 'Central DC'}:\n` +
  `Status: ${r.stock_status} | Available Qty: ${r.available_qty} ${r.unit || ''}\n` +
  `Lead Time: ${r.lead_time_days} days. ${restock}\n` +
  `${r.notes || ''}`;

return [{
  json: {
    response_message: msg.trim(),
    sources: [{ doc_id: "availability_sheet", title: "Availability Master", file_url: "", type: "availability" }]
  }
}];
```

---

### 2.9 UC6 — Appointment Scheduling Flow

#### Step 1: Extract Calendar Entities (Code Node)
```javascript
const e = $input.first().json.entities;
const now = new Date();
let startDate = e.preferred_date ? new Date(e.preferred_date) : new Date(now.getTime() + 86400000);
let startTime = e.preferred_time || '10:00';
const [h, m] = startTime.split(':');
startDate.setHours(parseInt(h), parseInt(m || '0'), 0, 0);
const endDate = new Date(startDate.getTime() + ((e.duration_minutes || 60) * 60000));

return [{
  json: {
    summary: 'Linde Gas Discussion',
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    attendees: e.attendee_emails || [],
    emailFromRequest: $('Webhook').first().json.body.email || null,
    conferenceType: e.platform || 'Meet',
    description: `Meeting requested via Linde AI Agent. Original request: "${$input.first().json.original_message}"`
  }
}];
```

#### Step 2: Create Google Calendar Event
**Node:** Google Calendar (Create Event)  
**Fields:**
- `summary`: `{{$json.summary}}`
- `start.dateTime`: `{{$json.start}}`
- `start.timeZone`: `Europe/Berlin`
- `end.dateTime`: `{{$json.end}}`
- `end.timeZone`: `Europe/Berlin`
- `attendees`: `{{$json.attendees}}`
- `conferenceData.createRequest.requestId`: `{{$now.toMillis()}}`
- `description`: `{{$json.description}}`

#### Step 3: Send Gmail Confirmation
**Node:** Gmail (Send)  
**To:** `{{$json.emailFromRequest || $json.attendees[0]}}`  
**Subject:** `Meeting Confirmed: {{$('Calendar Entities').first().json.summary}}`  
**Body:**
```
Your meeting has been scheduled.

Date: {{new Date($json.start).toUTCString()}}
Duration: {{$('Calendar Entities').first().json.duration_minutes || 60}} minutes
Meet Link: {{$json.hangoutLink || 'Link will be sent separately'}}

Regards,
Linde Gas AI Assistant
```

#### Step 4: Response Composer
```javascript
const event = $input.first().json;
return [{
  json: {
    response_message: `Meeting scheduled for ${new Date(event.start).toUTCString()}. Duration: ${$('Calendar Entities').first().json.duration_minutes || 60} min. Google Meet link: ${event.hangoutLink || '(pending)'}. Confirmation email sent.`,
    sources: [{
      doc_id: event.id,
      title: 'Calendar Event',
      file_url: event.htmlLink || '',
      type: 'appointment'
    }]
  }
}];
```

---

### 2.10 UC7 — Greeting / Smalltalk Flow

**Node:** Azure OpenAI Chat  
**System Prompt:**
```
You are Linde Gas AI Assistant. Respond warmly and briefly.
Mention only these capabilities:
1. Product Datasheets & SDS
2. Price Quotations
3. Delivery Status
4. Product Availability
5. Meeting Scheduling

Do not engage in extended small talk. Do not answer technical questions here.
```

**Response Composer:**
```javascript
const reply = $input.first().json.choices[0].message.content;
return [{
  json: {
    response_message: reply,
    sources: []
  }
}];
```

---

### 2.11 Out-of-Domain Response (Hard Fallback)

```javascript
return [{
  json: {
    response_message: "Sorry, I can only assist with Linde Gas information like datasheets, quotations, delivery status, availability, and scheduling.",
    sources: []
  }
}];
```

---

### 2.12 `/download-pdf-api` Webhook

**Node Type:** Webhook (POST)  
**Auth:** BasicAuth  
**Input Schema:**
```json
{
  "file_url": "string",
  "filename": "string",
  "email": "optional"
}
```

**Logic:**
1. Validate `file_url` is non-empty.
2. If `email` present → send Gmail with link (do NOT attach raw PDF unless file is under 10MB and hosted on Google Drive).
3. If no email → return binary stream via HTTP Response (binary mode).

**Gmail Send Node:**
```
Subject: Your Requested Linde Document — {{$json.filename}}
Body: Please find your requested document here: {{$json.file_url}}
```

---

### 2.13 Final Response Enforcer (Last Node Before Respond to Webhook)

**Code Node** — ensures contract compliance on every path:
```javascript
const data = $input.first().json;
const out = {
  response_message: typeof data.response_message === 'string' ? data.response_message : 'An unexpected error occurred.',
  sources: Array.isArray(data.sources) ? data.sources.map(s => ({
    doc_id: s.doc_id || '',
    title: s.title || '',
    file_url: s.file_url || '',
    type: s.type || ''
  })) : []
};
return [{ json: out }];
```

**Node:** Respond to Webhook  
**Response Code:** 200  
**Content-Type:** `application/json`

---

## PART 3 — ENVIRONMENT VARIABLES

| Variable | Description |
|---|---|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI resource endpoint URL |
| `AZURE_OPENAI_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT_CHAT` | `gpt-4o-mini` deployment name |
| `AZURE_OPENAI_DEPLOYMENT_EMBED` | `text-embedding-3-large` deployment name |
| `AZURE_OPENAI_API_VERSION` | e.g. `2024-02-01` |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_BASE_URL_DATASHEET` | Full base URL for `pinecode-vector-db-embedding-large-3072` index |
| `PINECONE_BASE_URL_QUOTATION` | Full base URL for `quotation-linde-large-3072` index |
| `DELIVERY_SHEET_ID` | Google Sheets ID for delivery status sheet |
| `AVAILABILITY_SHEET_ID` | Google Sheets ID for availability master sheet |
| `GMAIL_SENDER` | Authenticated Gmail sender address |
| `WEBHOOK_BASIC_AUTH_USER` | BasicAuth username for webhooks |
| `WEBHOOK_BASIC_AUTH_PASS` | BasicAuth password for webhooks |
| `N8N_BASE_URL` | n8n instance public URL (for internal HTTP calls) |

---

## PART 4 — API CONFIGURATIONS

### Azure OpenAI
- **Chat Completion:** `POST /openai/deployments/gpt-4o-mini/chat/completions?api-version={{AZURE_OPENAI_API_VERSION}}`
- **Embeddings:** `POST /openai/deployments/text-embedding-3-large/embeddings?api-version={{AZURE_OPENAI_API_VERSION}}`
- **Auth Header:** `api-key: {{AZURE_OPENAI_KEY}}`
- **Required params:** `max_tokens: 1500`, `temperature: 0` (determinism for grounding)

### Pinecone
- **Query:** `POST https://<index-host>/query`
- **Auth Header:** `Api-Key: {{PINECONE_API_KEY}}`
- **Body:** `{ "vector": [...], "topK": 4, "includeMetadata": true }`
- **Upsert (for ingestion):** `POST https://<index-host>/vectors/upsert`

### Google Sheets
- Use **n8n Google Sheets node** (OAuth2 service account)
- Required scopes: `https://www.googleapis.com/auth/spreadsheets.readonly`
- Read operation: `Get All Rows` (header row = row 1)
- Sheet must have row 1 as exact column headers matching spec

### Gmail
- Use **n8n Gmail node** (OAuth2)
- Required scope: `https://www.googleapis.com/auth/gmail.send`
- From: `{{GMAIL_SENDER}}`

### Google Calendar
- Use **n8n Google Calendar node** (OAuth2)
- Required scopes: `calendar.events`, `calendar.readonly`
- `conferenceDataVersion: 1` to generate Meet links
- TimeZone: `Europe/Berlin` (default for Linde Germany operations)

---

## PART 5 — DATA VALIDATION LOGIC

### Entity Normalization Rules

| Entity | Normalization |
|---|---|
| `gas` | Lowercase, trim. Map "O2"→"oxygen", "N2"→"nitrogen", "CO2"→"carbon dioxide". |
| `purity` | Extract number. "5.0", "99.9%", "grade 5" all resolve to purity string. |
| `sheet_type` | Map synonyms: "MSDS"→"SDS", "technical sheet"→"TDS", "datasheet"→"PDS". |
| `order_id` | Uppercase, trim, regex: `/^LG-\d{6}$/` |
| `preferred_date` | Resolve relative: "tomorrow"→ISO date, "next Monday"→ISO date. |
| `preferred_time` | Normalize to 24h format. "2 pm"→"14:00". |
| `email` | Validate regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `quantity` | Extract integer or float. Strip units. |
| `location` | Trim, lowercase. Accept city or region. |

### Sheet Data Guards
- If Google Sheets returns 0 rows → return "data unavailable" (not error).
- If sheet column is missing → log error + return "data temporarily unavailable".
- If date-time field is invalid → display raw string without crashing.

### Pinecone Guards
- If `matches` array is empty → trigger no-context path (never pass empty string to LLM).
- If metadata field `file_url` is missing → set `file_url: ""` in sources (do not crash).
- If embedding API returns error → return 500 with `"response_message": "Search service temporarily unavailable."`.

---

## PART 6 — ERROR HANDLING STRATEGY

### Error Classification

| Error Type | Behavior |
|---|---|
| `VALIDATION_ERROR` | Return 400 with descriptive message |
| `INTENT_PARSE_ERROR` | Default to `smalltalk` intent, log error |
| `PINECONE_TIMEOUT` | Return 503 with retry message |
| `SHEET_NOT_FOUND` | Return helpful "data unavailable" message in contract format |
| `CALENDAR_CREATE_FAIL` | Return error message, do not crash workflow |
| `EMAIL_SEND_FAIL` | Log and continue — do not block main response |
| `LLM_TIMEOUT` | Return 504 with degraded message |
| `OUT_OF_DOMAIN` | Return scoped rejection message |

### Global Error Handler (n8n Error Workflow)
- Catch all uncaught errors
- Log: `intent`, `entities`, `error_message`, `timestamp`, `workflow_node`
- Return fallback JSON:
```json
{
  "response_message": "I encountered an issue processing your request. Please try again or contact support.",
  "sources": []
}
```

### Logging Requirements (per PRD §10)
Each execution must log:
```json
{
  "timestamp": "ISO",
  "intent": "string",
  "confidence": "float",
  "entities": {},
  "pinecone_index": "string | null",
  "matched_docs": ["doc_id"],
  "response_time_ms": "number",
  "email_sent": "boolean",
  "error": "string | null"
}
```
Log destination: n8n execution log + optional Google Sheets Audit Log.

---

## PART 7 — TESTING STRATEGY PER USE CASE

### UC1 — Datasheet
| Test | Input | Expected |
|---|---|---|
| Happy path | "Send me SDS for Oxygen 5.0" | response_message with O2 safety info, source with `type: datasheet` |
| No purity | "I need datasheet for Nitrogen" | Best match retrieved, source cited |
| Unknown gas | "Datasheet for Unobtainium" | "Information not found in the data sheets." |
| With email | Message + `email: user@co.de` | Gmail triggered, PDF link sent |
| Empty Pinecone | Mock empty matches | "not found" message returned |

### UC2 — Delivery Status
| Test | Input | Expected |
|---|---|---|
| Valid order | "Track LG-240001" | Full status details returned |
| Invalid order | "Track LG-999999" | Not found message |
| No order ID | "What's my order status?" | Ask for order ID |
| Case insensitive | "track lg-240001" | Match found (case-insensitive fallback) |
| Missing columns | Remove carrier column | Graceful "N/A" shown |

### UC3 — Quotation
| Test | Input | Expected |
|---|---|---|
| Full data | "Quote 10 cylinders Nitrogen 5.0 Berlin" | Price, lead time, validity in response |
| Missing quantity | "Price for CO2" | Indicative range + 1 follow-up question |
| No pricing data | Mock empty Pinecone | Helpful fallback |
| With email | Quote + email | Gmail triggered |

### UC4 — Availability
| Test | Input | Expected |
|---|---|---|
| In stock | "Is Argon 5.0 available?" | Stock status + lead time |
| Out of stock | Query out-of-stock product | Status shows, restock date shown |
| Location filter | "Oxygen in Munich" | Filtered by location_dc |
| Not found | Obscure product | Clear not-available message |

### UC5 — Technical Advice (reuses UC1 path)
| Test | Input | Expected |
|---|---|---|
| In context | "Storage conditions for Oxygen?" | Retrieved from Pinecone chunk |
| Not in context | "Nuclear fusion temp for Helium?" | "Information not found in the data sheets." |

### UC6 — Appointment
| Test | Input | Expected |
|---|---|---|
| Full data | "Schedule meeting tomorrow 2pm" | Calendar event created, Meet link returned |
| No time given | "Book a demo" | Default tomorrow 10:00 CET |
| Email present | + email in request | Gmail confirmation sent |
| Multiple attendees | Emails in message | All added to attendees list |

### UC7 — Greeting
| Test | Input | Expected |
|---|---|---|
| Hello | "Hi" | Warm greeting + capability list |
| Off-topic | "Tell me about the weather" | Scoped to Linde capabilities |

### Confidence Threshold
| Test | Input | Expected |
|---|---|---|
| Low confidence | Ambiguous message | Clarification request returned |
| 0.6 boundary | Borderline intent | Exact threshold respected |

---

## PART 8 — DEPLOYMENT READINESS CHECKLIST

### Infrastructure
- [ ] n8n instance running (≥ v1.30) with error workflow configured
- [ ] Azure OpenAI: `gpt-4o-mini` and `text-embedding-3-large` deployments active
- [ ] Pinecone indexes `pinecode-vector-db-embedding-large-3072` and `quotation-linde-large-3072` created and populated
- [ ] Google Drive PDFs ingested into Pinecone with metadata: `filename`, `file_url`, `text`
- [ ] Delivery Status Google Sheet created with exact 21 columns as per spec
- [ ] Availability Master Google Sheet created with exact 9 columns as per spec

### Credentials & Auth
- [ ] `AZURE_OPENAI_KEY` and endpoint set in n8n credentials
- [ ] `PINECONE_API_KEY` set
- [ ] Google OAuth2 credentials configured (Sheets, Gmail, Calendar)
- [ ] BasicAuth configured on both webhook nodes
- [ ] All env variables set in n8n Settings → Environment Variables

### Workflow
- [ ] Main chat workflow activated
- [ ] Download PDF workflow activated
- [ ] All 7 intent branches wired to Switch Router
- [ ] Confidence Gate node in place before Switch
- [ ] Final Response Enforcer node before every Respond to Webhook
- [ ] Global error workflow assigned in n8n Settings

### Data Quality
- [ ] Google Sheets headers match spec exactly (case-sensitive)
- [ ] Pinecone metadata includes `file_url` and `text` fields
- [ ] At least 1 test record in Delivery Sheet
- [ ] At least 1 test record in Availability Sheet
- [ ] At least 3 PDFs ingested in datasheet index
- [ ] At least 1 PDF ingested in quotation index

### Response Contract Validation
- [ ] All paths return `response_message` (string)
- [ ] All paths return `sources` (array, never null)
- [ ] All source objects have `doc_id`, `title`, `file_url`, `type`
- [ ] No path returns bare text (unwrapped)
- [ ] Content-Type is `application/json` on all webhook responses

### Performance & Security
- [ ] Tested response time < 8 seconds on all happy paths
- [ ] BasicAuth verified on webhook — reject unauthenticated requests
- [ ] Confirmed: no Pinecone data merged across documents
- [ ] Confirmed: no LLM answer generated without retrieved context
- [ ] Gmail: confirmed no sensitive data in email body
- [ ] Google Drive links: confirmed no publicly accessible raw Drive links

### Final Acceptance Tests
- [ ] UC1 via Postman/curl — datasheet retrieved and cited
- [ ] UC2 via Postman/curl — order found and status returned
- [ ] UC3 via Postman/curl — quote generated from pricing index
- [ ] UC4 via Postman/curl — availability data returned from Sheets
- [ ] UC5 via Postman/curl — RAG-grounded technical answer
- [ ] UC6 via Postman/curl — Calendar event created + email sent
- [ ] UC7 via Postman/curl — greeting response scoped to capabilities
- [ ] Low-confidence test — clarification request returned
- [ ] Out-of-domain test — scoped rejection returned
- [ ] Email trigger test — Gmail send confirmed
- [ ] download-pdf-api test — PDF delivered or link emailed

---

## APPENDIX — n8n WORKFLOW NODE MAP

```
[Webhook: /chat-with-pdf-api]
    └─ [Input Validator]
        └─ [Intent Agent — Azure OpenAI]
            └─ [Parse Intent JSON]
                └─ [Confidence Gate]
                    └─ [Switch Router]
                        ├─ datasheet ──→ [Embed] → [Pinecone Query] → [Context Assemble] → [LLM Answer] → [Compose] → [Email?]
                        ├─ quotation ──→ [Enrich Query] → [Embed] → [Pinecone Query] → [Context Assemble] → [LLM Quote] → [Compose] → [Email?]
                        ├─ delivery_update ──→ [Extract Order ID] → [Sheets Read] → [Match] → [Compose]
                        ├─ availability ──→ [Extract Entities] → [Sheets Read] → [Match] → [Compose]
                        ├─ appointment ──→ [Parse Calendar] → [Google Calendar Create] → [Gmail Invite] → [Compose]
                        ├─ greeting ──→ [LLM Greeting] → [Compose]
                        ├─ smalltalk ──→ [LLM Greeting] → [Compose]
                        └─ clarification ──→ [Compose (static)]
                                │
                    [Final Response Enforcer]
                                │
                    [Respond to Webhook — 200 JSON]

[Webhook: /download-pdf-api]
    └─ [Validate file_url]
        └─ [Email check]
            ├─ email present ──→ [Gmail Send Link]
            └─ no email ──→ [HTTP Response — Binary PDF]
```

---

*END OF IMPLEMENTATION PLAN*
