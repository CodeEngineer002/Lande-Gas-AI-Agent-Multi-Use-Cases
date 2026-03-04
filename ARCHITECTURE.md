# Architecture — Linde Gas AI Agent

## 1. High-Level Architecture

User (Chat UI / API)
        ↓
Webhook (/chat-with-pdf-api)
        ↓
Intent Agent (Azure OpenAI)
        ↓
Entity Normalization Node
        ↓
Switch Router (by intent)
        ↓
-------------------------------------
| datasheet → RAG (Pinecone)       |
| quotation → RAG (Pricing Index)  |
| delivery_update → Google Sheet   |
| availability → Google Sheet      |
| appointment → Calendar Agent     |
| greeting/smalltalk → Greeting    |
-------------------------------------
        ↓
Response Composer
        ↓
JSON Contract Output
        ↓
(Optional)
- Email via Gmail
- PDF Download API
- Google Calendar Invite

---

## 2. Core Components

### 2.1 Intent Router
Model: Azure OpenAI (gpt-4o-mini)
Purpose:
- Classify intent
- Extract structured entities

Supported Intents:
- datasheet
- quotation
- delivery_update
- availability
- appointment
- greeting
- smalltalk

---

### 2.2 RAG Layer

#### Datasheet Index
- Pinecone index: pinecode-vector-db-embedding-large-3072
- Source: Google Drive PDFs
- Chunking: 3000 size / 200 overlap
- topK: 4

#### Quotation Index
- Pinecone index: quotation-linde-large-3072

Embedding Model:
- text-embedding-3-large

LLM Model:
- gpt-4o-mini

Grounding Rule:
- Must answer ONLY from retrieved chunks.

---

### 2.3 Structured Data Layer

Google Sheets:
- Delivery Status Sheet
- Availability Master Sheet

Must be treated as source of truth.

---

### 2.4 Action Layer

- Gmail → send PDF link / quote / invite
- Google Calendar → create event + Meet link
- Download PDF API → secure file delivery

---

## 3. Data Flow (Detailed)

1. User message → Webhook
2. Intent Agent returns:
   {
     intent,
     entities,
     confidence
   }
3. Switch routes to correct subflow
4. Subflow retrieves data
5. Response composed into strict JSON
6. Returned to frontend
7. Optional email triggered

---

## 4. Security Design

- BasicAuth on webhook
- No public Google Drive links
- Download via controlled endpoint
- No hallucinated data
- No merging of documents

---

END OF ARCHITECTURE
