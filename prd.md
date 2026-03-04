# PRD — Linde Gas AI Agent (RAG + Workflow Automation)

## 1. Overview

This Product Requirements Document (PRD) defines the full scope, architecture, behavior, and implementation requirements for the **Linde Gas AI Agent**.

Claude (or any implementation agent) must treat this PRD as the **single source of truth** for:

- System behavior
- Intent routing logic
- Data sources
- Response contracts
- Workflow orchestration
- Email + document delivery
- RAG grounding rules
- All supported use cases

This system is built on:

- n8n (workflow orchestration)
- Azure OpenAI (LLM + embeddings)
- Pinecone (Vector DB)
- Google Drive (Document storage)
- Google Sheets (Delivery + Availability data)
- Gmail (Email sending)
- Google Calendar (Appointment scheduling)

---

## 2. System Objective

Build an AI assistant that:

1. Understands user intent from chat
2. Routes to correct workflow
3. Retrieves data from appropriate source
4. Generates grounded response
5. Sends documents via chat and/or email
6. Maintains strict JSON response contract

---

## 3. Supported Use Cases (MANDATORY)

The system must support ALL use cases below.

---

## UC1 — Product Data Sheet / SDS Request (RAG Based)

### User Examples

- “Send me the datasheet for Oxygen 5.0”
- “I need SDS for CO2”
- “Technical sheet for Nitrogen”
- “MSDS for Argon”

### Intent
`datasheet`

### Required Behavior

1. Extract:
   - gas
   - purity (if mentioned)
   - sheet type (PDS / SDS / MSDS / TDS)

2. Retrieve relevant PDF chunks from:
   - Pinecone index: `pinecode-vector-db-embedding-large-3072`

3. Generate answer strictly from retrieved chunks.

4. Return:
   - Clear response
   - Source filename
   - file_url
   - type: datasheet

5. If user provides email → send link via Gmail.

### Output Contract (Mandatory)

```json
{
  "response_message": "string",
  "sources": [
    {
      "doc_id": "string",
      "title": "string",
      "file_url": "string",
      "type": "datasheet"
    }
  ]
}
```

---

## UC2 — Delivery Status

### User Examples

- “What’s the status of order LG-240001?”
- “ETA for my shipment?”
- “Track my order LG-240019”

### Intent
`delivery_update`

### Data Source
Google Sheets: Delivery Status Sheet

#### Required Columns (Exact)
- order_id
- product_name
- product_code
- grade_purity
- quantity
- unit
- order_date_utc
- promised_ship_date_utc
- eta_utc
- current_status
- status_detail
- po_number
- customer_name
- ship_to_city
- country
- carrier
- tracking_no
- ship_ready_utc
- expected_arrival_utc
- delivered_utc
- received_by

### Required Logic

1. Extract order_id
2. Match exact → if not found, case-insensitive match
3. If found:
   - Return status
   - ETA
   - Carrier
   - Tracking number
4. If not found:
   - Return helpful message
   - No hallucination

### Output Contract

```json
{
  "response_message": "string",
  "sources": [
    {
      "doc_id": "delivery_doc",
      "title": "Delivery Status Sheet",
      "file_url": "",
      "type": "delivery_update"
    }
  ]
}
```

---

## UC3 — Price Quotation (RAG Based)

### User Examples

- “Quote for 10 cylinders Nitrogen 5.0 Berlin”
- “Price for CO2 99.9%”
- “Quotation for Oxygen”

### Intent
`quotation`

### Data Source
Pinecone index:
`quotation-linde-large-3072`

(Price lists, discount tiers, freight zones, account pricing)

### Required Logic

1. Extract:
   - gas
   - purity
   - quantity
   - location
   - account_no (optional)

2. Retrieve relevant pricing documents

3. Compute:
   - unit price
   - discounts (if in doc)
   - freight
   - lead time
   - validity (default 30 days unless stated otherwise)

4. If data missing:
   - Ask ONE crisp follow-up
   - Still give indicative range

### Output Contract

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

---

## UC4 — Product Availability (NEW Required Use Case)

### User Examples

- “Is Argon 5.0 available?”
- “Availability of Oxygen in Munich?”
- “How fast can you deliver CO2?”

### Intent
`availability` (must be added to intent router)

### Data Source (MVP)
Google Sheets: Availability Master

#### Required Columns
- product_code
- product_name
- grade_purity
- location_dc
- stock_status
- available_qty
- lead_time_days
- next_restock_date
- notes

### Required Logic

1. Extract:
   - gas/product
   - purity
   - location

2. Match product
3. Return:
   - stock_status
   - lead_time_days
   - earliest dispatch
   - constraints

4. If not found:
   - Clear “not available” message
   - No hallucination

### Output Contract

```json
{
  "response_message": "string",
  "sources": [
    {
      "doc_id": "availability_sheet",
      "title": "Availability Master",
      "file_url": "",
      "type": "availability"
    }
  ]
}
```

---

## UC5 — Technical Advice (RAG Grounded)

### User Examples

- “What storage conditions for Oxygen?”
- “Can Nitrogen be used for inerting?”
- “Boiling point mentioned in datasheet?”

### Intent
`datasheet` (or optional `technical_advice`)

### Required Rules

- Must retrieve chunks from Pinecone
- Must answer ONLY from provided context
- Must cite source
- Must not use outside knowledge

If answer not found:
- Say clearly: “Information not found in the data sheets.”

---

## UC6 — Appointment Scheduling

### User Examples

- “Schedule meeting tomorrow 2 pm”
- “Book demo next Monday”
- “Send invite for discussion”

### Intent
`appointment`

### Required Behavior

1. Extract:
   - preferred_date
   - preferred_time
   - duration
   - email(s)
   - location/platform

2. Use Google Calendar
3. Generate Meet link
4. Send confirmation email
5. Return meeting summary in response

---

## UC7 — Greeting / Small Talk

### Intent
`greeting` or `smalltalk`

### Behavior
- Warm greeting
- Mention capabilities
- No long generic chat
- No technical hallucination

---

## 4. Intent Routing Rules (Mandatory)

Supported intents:

- datasheet
- quotation
- delivery_update
- availability
- appointment
- greeting
- smalltalk

If confidence < 0.6:
- Ask clarification question.

If user asks outside domain:
Return:
> “Sorry, I can only assist with Linde Gas information like datasheets, quotations, delivery status, availability, and scheduling.”

---

## 5. RAG Architecture

### Embeddings Model
`text-embedding-3-large`

### Datasheet Index
`pinecode-vector-db-embedding-large-3072`

### Quotation Index
`quotation-linde-large-3072`

### Chunking
- chunkSize: 3000
- overlap: 200

### Retrieval
- topK = 4

### Critical Rule
LLM must not answer beyond retrieved chunks.

---

## 6. APIs

### 6.1 Chat API
POST `/chat-with-pdf-api`

Request:
```json
{
  "message": "string",
  "email": "optional"
}
```

Response:
```json
{
  "response_message": "string",
  "sources": []
}
```

### 6.2 Download PDF API
POST `/download-pdf-api`

Request:
```json
{
  "file_url": "string",
  "filename": "string",
  "email": "optional"
}
```

Returns:
- Binary PDF OR
- Email sent via Gmail

---

## 7. Email Requirements

If email present:
- Send document link
- OR send calendar invite
- OR send quotation summary

No sensitive data leakage.

---

## 8. Non-Functional Requirements

- No hallucinations
- Strict JSON contract
- Response time < 8 seconds
- Secure webhook authentication
- No merging of data across different products
- Proper source citation

---

## 9. Error Handling Rules

If:
- Order not found → return helpful message
- Product not found → ask clarification
- Document not found → request more details
- Sheet empty → say data unavailable
- Availability missing → state clearly

Never fabricate data.

---

## 10. Logging & Observability

Must log:
- intent
- extracted entities
- selected document
- response time
- errors

---

## 11. Acceptance Criteria

System is complete only if:

- ✅ Datasheet retrieval works
- ✅ Delivery status works
- ✅ Quotation works
- ✅ Availability works
- ✅ Technical advice grounded
- ✅ Appointment scheduling works
- ✅ Email sending works
- ✅ JSON contract consistent across all flows

---

## 12. Out of Scope

- ERP integration
- Payment processing
- Order placement
- Multi-language support
- Advanced UI rendering

---

## 13. Implementation Instruction to Claude

Claude must:

1. Follow this PRD strictly.
2. Implement routing exactly as specified.
3. Maintain JSON contract consistency.
4. Never hallucinate data.
5. Always prefer structured data sources over LLM guessing.
6. Treat Google Sheets and Pinecone as authoritative sources.

---

END OF PRD
