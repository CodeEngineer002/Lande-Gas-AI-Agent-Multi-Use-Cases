import { NextRequest, NextResponse } from 'next/server';
import type { DeliveryData } from '@/lib/types';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.acngva.com';
const TRACKING_EMAIL_PATH =
  process.env.N8N_TRACKING_EMAIL_PATH || '/webhook/email-tracking-snapshot';

export async function POST(req: NextRequest) {
  let body: { email?: string; tracking_data?: DeliveryData };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { email, tracking_data } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid recipient email is required.' }, { status: 400 });
  }
  if (!tracking_data) {
    return NextResponse.json({ error: 'Tracking data is required.' }, { status: 400 });
  }

  let n8nResponse: Response;
  try {
    n8nResponse = await fetch(`${N8N_WEBHOOK_URL}${TRACKING_EMAIL_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tracking_data }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    console.error('[email-tracking] fetch error:', err);
    return NextResponse.json(
      { error: isTimeout ? 'Request timed out.' : 'Could not reach email service.' },
      { status: 503 }
    );
  }

  if (!n8nResponse.ok) {
    const text = await n8nResponse.text().catch(() => '');
    console.error('[email-tracking] n8n error', n8nResponse.status, text);
    return NextResponse.json({ error: 'Email service returned an error.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

