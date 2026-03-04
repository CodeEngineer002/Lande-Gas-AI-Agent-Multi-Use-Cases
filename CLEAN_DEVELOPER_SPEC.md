# Developer Spec — Linde Gas AI Agent

## Intent List
datasheet
quotation
delivery_update
availability
appointment
greeting
smalltalk

---

## JSON Response Contract (Mandatory)

{
  "response_message": "string",
  "sources": [
    {
      "doc_id": "string",
      "title": "string",
      "file_url": "string",
      "type": "intent_type"
    }
  ]
}

---

## RAG Config
Embedding Model: text-embedding-3-large
LLM: gpt-4o-mini
Chunk Size: 3000
Overlap: 200
TopK: 4

Indexes:
- pinecode-vector-db-embedding-large-3072
- quotation-linde-large-3072

---

## Delivery Sheet Columns
order_id
product_name
product_code
grade_purity
quantity
unit
order_date_utc
promised_ship_date_utc
eta_utc
current_status
status_detail
po_number
customer_name
ship_to_city
country
carrier
tracking_no
ship_ready_utc
expected_arrival_utc
delivered_utc
received_by

---

## Availability Sheet Columns
product_code
product_name
grade_purity
location_dc
stock_status
available_qty
lead_time_days
next_restock_date
notes

---

## API Endpoints
POST /chat-with-pdf-api
POST /download-pdf-api

---

## Rules
- No hallucination
- No merging documents
- If data not found → say clearly
- If confidence < 0.6 → ask clarification
- Always structured JSON output

END OF DEVELOPER SPEC
