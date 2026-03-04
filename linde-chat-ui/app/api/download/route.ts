import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.acngva.com';
const DOWNLOAD_PATH = '/webhook/download-linde-pdf-api';

export async function POST(req: NextRequest) {
  let body: {
    doc_id?: string;
    filename?: string;
    file_url?: string;
    email?: string;
    sessionId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const isEmail = !!body.email;

  // Guard: can't download without a file URL
  if (!isEmail && (!body.file_url || body.file_url.trim() === '')) {
    return NextResponse.json(
      { error: 'Document URL is not available. Please ask again or contact support.' },
      { status: 422 }
    );
  }

  let n8nResponse: Response;
  try {
    n8nResponse = await fetch(`${N8N_WEBHOOK_URL}${DOWNLOAD_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    console.error('[Linde Download API] fetch error:', err);
    return NextResponse.json(
      { error: isTimeout ? 'Request timed out.' : 'Could not reach download service.' },
      { status: 503 }
    );
  }

  if (!n8nResponse.ok) {
    const text = await n8nResponse.text().catch(() => '');
    console.error('[Linde Download API] n8n returned', n8nResponse.status, text);
    return NextResponse.json({ error: 'Download service error.' }, { status: 502 });
  }

  // Email mode: just return status
  if (isEmail) {
    return NextResponse.json({ ok: true });
  }

  // PDF download mode: stream the blob back
  const contentType = n8nResponse.headers.get('Content-Type') || '';
  const contentDisposition = n8nResponse.headers.get('Content-Disposition') || '';

  if (!/pdf|octet-stream|binary/i.test(contentType)) {
    return NextResponse.json({ error: 'Download not available.' }, { status: 422 });
  }

  const blob = await n8nResponse.arrayBuffer();
  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      ...(contentDisposition ? { 'Content-Disposition': contentDisposition } : {}),
    },
  });
}
