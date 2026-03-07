# Product Tour Video Script — Linde Gas AI Assistant

**Target Duration:** 4–5 minutes  
**Format:** Screen recording + voiceover  
**Tone:** Professional, clear, enterprise SaaS demo  
**Resolution:** 1920×1080, 60fps  

---

## SCENE 1 — INTRO (0:00 – 0:25)

**Screen:** Linde Chat UI landing page — dark-themed enterprise interface with the empty state showing "Ask Linde Gas AI Agent" with the animated chat icon and three quick-action chips (Product Datasheet, Delivery Status, Request Quote).

**Action:** Camera slowly zooms in on the empty state. The three chips gently animate in.

**Voiceover:**
> "Managing industrial gas operations means juggling product datasheets, delivery tracking, quotation requests, and scheduling — often across multiple systems and people.
>
> What if one intelligent assistant could handle all of it — instantly, from a single chat interface?
>
> Meet the Linde Gas AI Assistant."

**Caption:** `Linde Gas AI Assistant — Your Intelligent Industrial Gas Copilot`

---

## SCENE 2 — THE PROBLEM (0:25 – 0:55)

**Screen:** Split-screen montage — left side shows a cluttered email inbox with subject lines like "RE: RE: Oxygen SDS needed", "Quote request — Nitrogen 5.0", "Order LG-240012 status?". Right side shows multiple browser tabs open: Google Drive, a spreadsheet, a calendar.

**Action:** Tabs and emails pile up with a subtle overwhelm animation. Then the screen wipes clean to the Linde AI chat interface.

**Voiceover:**
> "Today, getting a product datasheet means emailing a colleague. Checking a delivery means opening a spreadsheet. Requesting a quote means filling out a form and waiting.
>
> Each request involves a different system, a different person, and a different wait time.
>
> The Linde Gas AI Assistant consolidates all of this into a single conversational interface — powered by AI that understands your intent and retrieves real data in seconds."

**Caption:** `One interface. Every workflow. Instant answers.`

---

## SCENE 3 — PRODUCT OVERVIEW (0:55 – 1:35)

**Screen:** Full view of the Linde Chat UI — left sidebar with navigation, center chat area, right panel showing "Context & Sources."

**Action:** Mouse highlights each section as the voiceover describes it. Subtle glow outlines appear around each area.

**Voiceover:**
> "The platform runs on a Next.js frontend connected to an AI orchestration engine built on n8n workflows, Azure OpenAI, and Pinecone vector search.
>
> On the left — your navigation and download history.  
> In the center — a full-featured AI chat with rich response cards.  
> On the right — a transparency panel showing AI confidence scores, cited sources, and contextual actions.
>
> The system supports seven core capabilities: product datasheet retrieval, price quotations, delivery status tracking, product availability checks, appointment scheduling, and general inquiries — all through natural language."

**Caption:** `7 core capabilities — all through natural language`

---

## SCENE 4 — FEATURE DEMO: PRODUCT DATASHEET (1:35 – 2:15)

**Screen:** Chat input focused. User types a query.

**Action:**  
1. User types: `Send me the datasheet for Oxygen 5.0`  
2. Press Enter → typing indicator appears ("Analyzing your query…")  
3. AI responds with a natural language summary + a PDF document card (red PDF icon, filename "Oxygen_5.0_PDS.pdf", "Product Datasheet" subtitle)  
4. User clicks the download arrow on the card → toast appears: "Successfully downloaded"  
5. Right panel updates — confidence bar fills to 0.92, source citation appears  

**Voiceover:**
> "Let's start with the most common request — a product datasheet.
>
> I'll type: 'Send me the datasheet for Oxygen 5.0.'
>
> The AI identifies the intent, searches the document index using vector embeddings, and returns the matching PDF — with a direct download button right in the chat.
>
> Notice the right panel — it shows a 92% confidence score and cites the exact source document. Full transparency into how the AI arrived at its answer."

**Caption:** `RAG-powered document retrieval with source transparency`

---

## SCENE 5 — FEATURE DEMO: MULTI-DOCUMENT RESPONSE (2:15 – 2:55)

**Screen:** New query in the chat.

**Action:**  
1. User types: `I need datasheets for Nitrogen, Argon, and Hydrogen`  
2. AI responds with three document cards stacked vertically (each with PDF icon, distinct filename, download button)  
3. In the bubble footer, the "Download All" button appears next to Copy and Email  
4. User clicks "Download All" → toast: "Preparing ZIP with 3 files…" → "ZIP downloaded successfully"  
5. User clicks the Email button → email prompt appears → enters email → toast: "Email sent successfully"

**Voiceover:**
> "Need multiple documents at once? Just ask naturally.
>
> 'I need datasheets for Nitrogen, Argon, and Hydrogen.'
>
> The AI detects all three gases, retrieves each matching document, and presents them as individual cards — each independently downloadable.
>
> But notice this button — Download All. One click bundles every document into a ZIP file and saves it to your machine.
>
> You can also email all documents directly to a colleague. Enter their address, and the system sends everything in a single email through Gmail integration."

**Caption:** `Multi-document responses — download individually, as ZIP, or email all`

---

## SCENE 6 — FEATURE DEMO: QUOTATION REQUEST (2:55 – 3:25)

**Screen:** New query.

**Action:**  
1. User types: `Quote for 10 cylinders Nitrogen 5.0 Berlin`  
2. AI responds with pricing summary in natural language + quotation document card  
3. Mouse hovers over the document card showing "Quotation" subtitle  

**Voiceover:**
> "Quotation requests work the same way.
>
> 'Quote for 10 cylinders, Nitrogen 5.0, Berlin.'
>
> The AI extracts the product, quantity, and location — retrieves the relevant pricing document from the quotation index — and generates a clear summary with the source document attached.
>
> No forms. No waiting. Indicative pricing in seconds."

**Caption:** `Instant quotations — extracted from real pricing documents`

---

## SCENE 7 — FEATURE DEMO: DELIVERY TRACKING (3:25 – 3:55)

**Screen:** New query.

**Action:**  
1. User types: `What's the status of order LG-240012?`  
2. AI responds with natural language status + a rich delivery tracking card  
3. Card shows: 5-step progress bar (Confirmed → Packed → In Transit → Out for Delivery → Delivered), animated truck icon at "In Transit", info tiles (Order ID, Carrier, ETA, Customer, Destination)  
4. User clicks Email button on the bubble → enters email → toast: "Tracking snapshot sent!"  

**Voiceover:**
> "Delivery tracking is fully integrated with live order data.
>
> 'What's the status of order LG-240012?'
>
> The AI queries the delivery sheet in real time and renders a visual tracking card — showing the current status, carrier, ETA, and destination on an animated progress timeline.
>
> You can email this tracking snapshot to anyone — it's sent as a formatted summary, not just raw text."

**Caption:** `Real-time delivery tracking with visual progress cards`

---

## SCENE 8 — FEATURE DEMO: MULTI-INTENT QUERY (3:55 – 4:20)

**Screen:** New query.

**Action:**  
1. User types: `Send me all product datasheets and a quotation for Hydrogen`  
2. AI responds with a combined message — multiple datasheet cards + a quotation card, clearly labeled  
3. Right panel shows `intents: ["datasheet", "quotation"]` in the meta section  

**Voiceover:**
> "Here's where it gets powerful. You can combine requests in a single message.
>
> 'Send me all product datasheets and a quotation for Hydrogen.'
>
> The AI detects two intents — datasheet and quotation — routes each to the correct pipeline, and merges the results into one unified response. Datasheets for all available products, plus the Hydrogen pricing document, all in a single reply.
>
> The context panel confirms both intents were detected and processed."

**Caption:** `Multi-intent AI — handles complex requests in a single message`

---

## SCENE 9 — SETTINGS & CUSTOMIZATION (4:20 – 4:35)

**Screen:** Navigate to Settings page via left sidebar.

**Action:**  
1. Click Settings icon in sidebar  
2. Show the Settings page — toggle switches and dropdowns  
3. Toggle "Sound on AI Response" ON → brief tri-tone plays  
4. Switch "Response Format" dropdown from "Both" to "Structured"  
5. Toggle "Linde Branding" ON — UI shifts to branded theme  

**Voiceover:**
> "The platform is fully configurable. Enable notification sounds, choose between natural language or structured card responses, toggle Linde branding, and adjust privacy settings — all from a clean settings panel."

**Caption:** `Configurable enterprise settings`

---

## SCENE 10 — CONCLUSION (4:35 – 5:00)

**Screen:** Back to main chat view. The chat shows the conversation history from the demo. Camera slowly zooms out to show the full interface.

**Action:** Quick montage of key moments: document card download, ZIP toast, delivery tracking card, multi-intent response. Fade to Linde logo + tagline.

**Voiceover:**
> "The Linde Gas AI Assistant brings together document retrieval, quotations, delivery tracking, scheduling, and product availability — all in one conversational interface.
>
> No more switching between systems. No more waiting for email replies. Just ask, and the AI delivers — with full transparency, real data, and enterprise-grade reliability.
>
> Built for Linde. Powered by AI. Ready for your team."

**Caption:** `Linde Gas AI Assistant — Ask. Get answers. Move faster.`

**End Card:**  
```
Linde Gas AI Assistant
────────────────────
Powered by Azure OpenAI · Pinecone · n8n
Built with Next.js

[Request Demo]   [Contact Sales]
```

---

## Production Notes

| Item | Recommendation |
|---|---|
| **Music** | Subtle, modern corporate ambient track. Low volume, no lyrics. Fade in at Scene 1, fade out at End Card. |
| **Transitions** | Clean crossfades between scenes. No flashy effects — keep it enterprise. |
| **Mouse cursor** | Use a spotlight/highlight cursor effect for key clicks. |
| **Recording tool** | Screen Studio, OBS, or Loom (Pro) at 1080p 60fps. |
| **Voiceover** | Professional male/female voice. Measured pace, ~140 words/min. Alternatively, use ElevenLabs or similar for AI narration. |
| **Captions** | Render as lower-third overlays with semi-transparent dark background. White text, 18px, clean sans-serif font. |
| **Timing** | Each scene has 5–10 seconds of buffer. Total script reads at ~4:45 at natural pace. |

### Pre-Recording Checklist

- [ ] Clear all chat history (fresh conversation)
- [ ] Enable Linde branding mode for branded feel
- [ ] Ensure n8n workflows are active and responsive
- [ ] Pre-test all demo queries to verify correct responses
- [ ] Set browser zoom to 100%, hide bookmarks bar
- [ ] Disable OS notifications during recording
- [ ] Test audio levels for voiceover

---

*Script prepared for the Linde Gas AI Assistant product tour video.*
