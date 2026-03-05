import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.acngva.com';
const WEBHOOK_PATH = '/webhook/chat-with-linde-ai-agent';
const IS_DEV = process.env.NODE_ENV !== 'production';

export async function POST(req: NextRequest) {
  let body: { message?: string; email?: string; sessionId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { response_message: 'Invalid request body.', sources: [] },
      { status: 400 }
    );
  }

  const { message, email, sessionId } = body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return NextResponse.json(
      { response_message: 'Message is required.', sources: [] },
      { status: 400 }
    );
  }

  const requestBody: { message: string; email?: string; sessionId?: string } = {
    message: message.trim(),
    sessionId: sessionId || '',
  };
  if (email && email.trim()) {
    requestBody.email = email.trim();
  }

  let n8nResponse: Response;
  try {
      n8nResponse = await fetch(`${N8N_WEBHOOK_URL}${WEBHOOK_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(90000),
    });
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error && err.name === 'TimeoutError';
    console.error('[Linde Chat API] n8n fetch error:', err);
    return NextResponse.json(
      {
        response_message: isTimeout
          ? 'The request timed out. Please try again.'
          : 'Could not reach the AI service. Please try again later.',
        sources: [],
      },
      { status: 503 }
    );
  }

  if (!n8nResponse.ok) {
    const text = await n8nResponse.text().catch(() => '');
    console.error('[Linde Chat API] n8n error status:', n8nResponse.status, text.slice(0, 500));

    // Try to parse as JSON — n8n sometimes sends structured errors even on 4xx/5xx
    try {
      const errJson = JSON.parse(text) as Record<string, unknown>;
      // If n8n returned a valid response contract despite bad status, pass it through
      if (typeof errJson?.response_message === 'string') {
        const sources = Array.isArray(errJson.sources)
          ? (errJson.sources as Record<string, unknown>[]).map((s) => ({
              doc_id: String(s.doc_id ?? ''),
              title: String(s.title ?? ''),
              file_url: String(s.file_url ?? ''),
              type: String(s.type ?? ''),
            }))
          : [];
        return NextResponse.json(
          { response_message: errJson.response_message, sources, meta: { confidence: null, sources_used: sources.length } },
          { status: 200 },
        );
      }
    } catch { /* not JSON — fall through to generic error */ }

    const userMsg =
      n8nResponse.status === 408 || n8nResponse.status === 504
        ? 'The request timed out processing your query. Please try again.'
        : IS_DEV
          ? `AI service error (HTTP ${n8nResponse.status}): ${text.slice(0, 200)}`
          : 'The AI service returned an error. Please try again.';

    return NextResponse.json(
      { response_message: userMsg, sources: [], meta: { confidence: null, sources_used: 0 } },
      { status: 502 },
    );
  }

  let data: unknown;
  try {
    data = await n8nResponse.json();
  } catch (parseErr) {
    const rawText = await n8nResponse.text().catch(() => '');
    console.error('[Linde Chat API] n8n JSON parse failed:', String(parseErr), 'raw:', rawText.slice(0, 300));
    const msg = IS_DEV
      ? `Received non-JSON from AI service: ${rawText.slice(0, 150)}`
      : 'Received an invalid response from the AI service.';
    return NextResponse.json(
      { response_message: msg, sources: [], meta: { confidence: null, sources_used: 0 } },
      { status: 502 },
    );
  }

  // Enforce contract shape before passing to client
  const typed = data as Record<string, unknown>;

  const sources = Array.isArray(typed?.sources)
    ? (typed.sources as Record<string, unknown>[]).map((s) => ({
        doc_id: String(s.doc_id ?? ''),
        title: String(s.title ?? ''),
        file_url: String(s.file_url ?? ''),
        type: String(s.type ?? ''),
      }))
    : [];

  // Extract meta from n8n response (confidence + sources_used + intents for multi-intent)
  const rawMeta = typed?.meta as Record<string, unknown> | undefined;
  const confidence =
    typeof rawMeta?.confidence === 'number' ? rawMeta.confidence : null;
  const intents = Array.isArray(rawMeta?.intents)
    ? (rawMeta.intents as unknown[]).map(String)
    : undefined;

  // Pass structured delivery_data if present (from N8N structured JSON output)
  const rawDelivery = typed?.delivery_data as Record<string, unknown> | undefined;
  const strOrNull = (v: unknown) => (v && v !== 'null' ? String(v) : null);
  const delivery_data = rawDelivery && typeof rawDelivery === 'object' ? {
    order_id:           String(rawDelivery.order_id           ?? ''),
    current_status:     String(rawDelivery.current_status     ?? ''),
    status_detail:      strOrNull(rawDelivery.status_detail),
    order_date:         strOrNull(rawDelivery.order_date),
    promised_ship_date: strOrNull(rawDelivery.promised_ship_date),
    eta:                strOrNull(rawDelivery.eta),
    delivered_date:     strOrNull(rawDelivery.delivered_date),
    carrier:            strOrNull(rawDelivery.carrier),
    tracking_number:    strOrNull(rawDelivery.tracking_number),
    customer_name:      strOrNull(rawDelivery.customer_name),
    ship_to_city:       strOrNull(rawDelivery.ship_to_city),
    country:            strOrNull(rawDelivery.country),
    received_by:        strOrNull(rawDelivery.received_by),
    product:            strOrNull(rawDelivery.product),
  } : undefined;

  const sanitized = {
    response_message:
      typeof typed?.response_message === 'string'
        ? typed.response_message
        : 'No response received.',
    sources,
    meta: {
      confidence,
      sources_used: sources.length,
      ...(intents ? { intents } : {}),
    },
    ...(delivery_data ? { delivery_data } : {}),
  };

  return NextResponse.json(sanitized, { status: 200 });
}
