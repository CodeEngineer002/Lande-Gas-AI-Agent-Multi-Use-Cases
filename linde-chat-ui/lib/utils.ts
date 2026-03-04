import type { DeliveryData, AppointmentData, Source } from './types';

/** Timestamp string */
export const ts = () => new Date().toLocaleString();

/** Escape HTML */
export const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Very lightweight markdown → HTML (mirrors the HTML file's mdLite function) */
export function mdLite(raw: string): string {
  let t = String(raw ?? '').trim();
  t = esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```([\s\S]*?)```/g, (_m, c) => '<pre><code>' + c.replace(/</g, '&lt;') + '</code></pre>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/(?:^|\n)\s*-\s+(.+)/gm, (_m, i) => '\n\u2022 ' + i);

  const lines = t.split(/\n+/);
  const out: string[] = [];
  let ul: string[] = [];
  let ol: string[] = [];

  const flush = () => {
    if (ul.length) { out.push('<ul>' + ul.map(x => '<li>' + x + '</li>').join('') + '</ul>'); ul = []; }
    if (ol.length) { out.push('<ol>' + ol.map(x => '<li>' + x + '</li>').join('') + '</ol>'); ol = []; }
  };

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(\d+)\.\s+(.+)$/))) { ol.push(m[2]); continue; }
    if ((m = line.match(/^•\s+(.+)$/))) { ul.push(m[1]); continue; }
    if ((m = line.match(/^([A-Za-z][A-Za-z0-9 _/%°.\-()]{1,60})\s*:\s*(.+)$/))) {
      flush(); out.push('<div><strong>' + m[1] + ':</strong> ' + m[2] + '</div>'); continue;
    }
    flush(); out.push('<p>' + line + '</p>');
  }
  flush();
  return out.join('');
}

/** Detect greeting messages */
export function isGreeting(q: string): boolean {
  const s = String(q ?? '').trim().toLowerCase();
  const simple = ['hi','hello','hey','yo','hii','hiii','good morning','good afternoon','good evening',
    'how are you','how r u','what do you do','who are you','help','menu'];
  if (simple.includes(s)) return true;
  if (/^(hi|hello|hey)[!. ]*$/i.test(q)) return true;
  if (/^how (are|r) (you|u)\b/i.test(s)) return true;
  if (/^(what do you do|who (are|r) you)\b/i.test(s)) return true;
  return false;
}

/** Extract delivery data from response text (fallback — used when N8N returns plain text) */
export function extractDeliveryData(text: string): DeliveryData {
  const d: DeliveryData = { order_id: '', current_status: '' };

  const orderMatch = text.match(/Order\s*ID[:\s]*([A-Z0-9\-]+)/i)
    || text.match(/LG[-_][A-Z0-9]+/i)
    || text.match(/([A-Z]{2}-\d+)/);
  if (orderMatch) d.order_id = (orderMatch[1] || orderMatch[0]).trim();

  const statusMatch = text.match(/Current\s*Status[:\s]*([^\n.]+)/i)
    || text.match(/Status[:\s]*([^\n.]+)/i)
    || text.match(/-?\s*\*\*Current Status\*\*[:\s]*([^\n]+)/i);
  if (statusMatch) d.current_status = statusMatch[1].trim().replace(/\*\*/g, '');

  const carrierMatch = text.match(/Carrier[:\s]*([^\n.]+)/i)
    || text.match(/Shipped Via[:\s]*([^\n.]+)/i)
    || text.match(/(UPS|DHL|FedEx|USPS)/i);
  if (carrierMatch) d.carrier = (carrierMatch[1] || carrierMatch[0]).trim();

  const etaMatch = text.match(/ETA[:\s]*([^\n.]+)/i)
    || text.match(/Expected[:\s]*([^\n.]+)/i)
    || text.match(/Promised[:\s]*([^\n.]+)/i)
    || text.match(/(November|December|January|February|March|April|May|June|July|August|September|October)\s+\d{1,2},?\s+\d{4}/i);
  if (etaMatch) d.eta = (etaMatch[1] || etaMatch[0]).trim();

  const trackingMatch = text.match(/Tracking\s*(?:Number|No|#)[:\s]*([^\n.]+)/i);
  if (trackingMatch) d.tracking_number = trackingMatch[1].trim();

  const productMatch = text.match(/Product\s*(?:Name|)[:\s]*([^\n.]+)/i);
  if (productMatch) d.product = productMatch[1].trim();

  const destMatch = text.match(/(?:Destination|Ship\s*To\s*City)[:\s]*([^\n.]+)/i);
  if (destMatch) d.ship_to_city = destMatch[1].trim();

  const orderDateMatch = text.match(/Order\s*Date[:\s]*([^\n.]+)/i);
  if (orderDateMatch) d.order_date = orderDateMatch[1].trim();

  const deliveredMatch = text.match(/Delivered\s*(?:At|On|Date)[:\s]*([^\n.]+)/i);
  if (deliveredMatch) d.delivered_date = deliveredMatch[1].trim();

  // Line-by-line fallback for unparsed fields
  if (!d.current_status) {
    for (const raw of text.split('\n')) {
      const l = raw.replace(/\*\*/g, '').trim();
      if (l.toLowerCase().includes('current status') && !d.current_status)
        d.current_status = l.split(':')[1]?.trim() || '';
      if (l.toLowerCase().includes('order id') && !d.order_id)
        d.order_id = l.split(':')[1]?.trim() || '';
      if ((l.toLowerCase().includes('carrier') || l.toLowerCase().includes('shipped via')) && !d.carrier)
        d.carrier = l.split(':')[1]?.trim() || '';
      if ((l.toLowerCase().includes('eta') || l.toLowerCase().includes('expected')) && !d.eta)
        d.eta = l.split(':')[1]?.trim() || '';
    }
  }
  return d;
}

/** Extract appointment data from response text + sources */
export function extractAppointmentData(text: string, sources: Source[]): AppointmentData {
  const d: AppointmentData = {
    startDateTime: '',
    endDateTime: '',
    meetLink: '',
    title: 'Meeting with Linde representative',
  };

  if (sources?.[0]?.file_url) d.meetLink = sources[0].file_url;
  if (sources?.[0]?.title) d.title = sources[0].title;

  const m1 = text.match(/Your meeting is booked on (.+) → (.+)\. Meet link: (.+)/);
  if (m1) {
    d.startDateTime = m1[1];
    d.endDateTime = m1[2];
    if (!d.meetLink) d.meetLink = m1[3];
  }

  if (!d.startDateTime) {
    const isoMatches = text.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[\+\-]\d{2}:\d{2})/g);
    if (isoMatches && isoMatches.length >= 2) {
      d.startDateTime = isoMatches[0];
      d.endDateTime = isoMatches[1];
    }
  }
  return d;
}

/** Safe base64 encoding for JSON data */
export function safeB64(obj: unknown): string {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj || [])))); }
  catch { return ''; }
}

/** Parse base64-encoded JSON */
export function parseB64<T>(s: string): T | null {
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  catch { return null; }
}

/** Extract filename from Content-Disposition header */
export function filenameFromCD(cd: string | null): string | null {
  if (!cd) return null;
  const m1 = cd.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  const m2 = cd.match(/filename="?([^"]+)"?/i);
  const val = (m1 && m1[1]) || (m2 && m2[1]) || null;
  return val ? decodeURIComponent(val.trim()) : null;
}
