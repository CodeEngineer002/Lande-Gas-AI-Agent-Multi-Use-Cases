# Sequence Diagram — Linde Gas AI Agent

## UC1: Datasheet Request
User → Webhook → Intent Agent → Pinecone Retrieve → LLM Generate Answer → Response Composer → (Optional) Gmail → User

## UC2: Delivery Status
User → Webhook → Intent Agent → Delivery Agent → Google Sheets → Response Composer → User

## UC3: Quotation
User → Webhook → Intent Agent → Pinecone (Pricing Index) → LLM Quote Generator → Response Composer → User

## UC4: Availability
User → Webhook → Intent Agent → Availability Agent → Google Sheets → Response Composer → User

## UC5: Appointment
User → Webhook → Intent Agent → Calendar Agent → Google Calendar → Gmail Invite → Response Composer → User

## UC6: Greeting
User → Webhook → Intent Agent → Greeting Agent → Response Composer → User

END OF SEQUENCE DIAGRAM
