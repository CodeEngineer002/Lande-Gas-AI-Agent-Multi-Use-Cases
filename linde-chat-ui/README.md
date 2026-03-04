# Linde Gas AI — Chat Frontend

## Stack
- **Next.js 14** (App Router)
- **Tailwind CSS**
- **TypeScript**
- Server-side API route proxies all calls to the n8n webhook (avoids CORS, hides the n8n URL from the browser)

---

## Quick Start

```bash
cd linde-chat-ui
npm install
cp .env.local.example .env.local
# Edit .env.local and set N8N_WEBHOOK_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `N8N_WEBHOOK_URL` | Yes | Base URL of your n8n instance (no trailing slash) |

---

## Project Structure

```
linde-chat-ui/
├── app/
│   ├── api/chat/route.ts   ← Server-side proxy to n8n /chat-with-pdf-api
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            ← Chat page
├── components/
│   ├── ChatWindow.tsx      ← State management & message thread
│   ├── InputBar.tsx        ← Message input + optional email field
│   ├── MessageBubble.tsx   ← Renders user & assistant messages
│   ├── SourceCard.tsx      ← Renders source documents per use case type
│   ├── SuggestedPrompts.tsx← Quick-launch buttons for each UC
│   └── TypingIndicator.tsx ← Animated dots while waiting
├── lib/
│   └── types.ts            ← Shared TypeScript types (response contract)
├── .env.local.example
└── package.json
```

---

## Response Contract

Every response from n8n must match:

```json
{
  "response_message": "string",
  "sources": [
    {
      "doc_id": "string",
      "title": "string",
      "file_url": "string",
      "type": "datasheet | quotation | delivery_update | availability | appointment | greeting | smalltalk"
    }
  ]
}
```

The API route at `/api/chat/route.ts` enforces and sanitizes this contract before data reaches the UI.

---

## Source Card Rendering by Intent

| `type` value | Icon | Colour | Action |
|---|---|---|---|
| `datasheet` | FileText | Linde Blue | Open PDF link |
| `quotation` | DollarSign | Green | Open PDF link |
| `delivery_update` | Truck | Orange | No link (sheet data) |
| `availability` | PackageCheck | Purple | No link (sheet data) |
| `appointment` | CalendarCheck | Rose | Open calendar event link |

---

## Email Integration

Click the **envelope icon** in the input bar to reveal an optional email field. When filled:
- The email is passed to n8n in the request body as `email`
- n8n routes it to Gmail for document/calendar delivery
- The frontend receives the same JSON response (confirms delivery in `response_message`)

---

## Deployment

```bash
npm run build
npm start
```

Or deploy to Vercel:
```bash
npx vercel
```

Set `N8N_WEBHOOK_URL` as an environment variable in your Vercel project settings.
