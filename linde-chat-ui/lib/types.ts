// ---------------------------------------------------------------------------
// Shared types for Linde Gas AI Agent chat UI
// ---------------------------------------------------------------------------

export type IntentType =
  | 'datasheet'
  | 'quotation'
  | 'delivery_update'
  | 'delivery_status'
  | 'availability'
  | 'appointment'
  | 'greeting'
  | 'smalltalk'
  | '';

export interface Source {
  doc_id: string;
  title: string;
  file_url: string;
  type: IntentType;
}

/** Optional transparency metadata per assistant response */
export interface ResponseMeta {
  confidence: number | null;   // 0.0‒1.0 float, null if unavailable
  sources_used: number;
  intents?: string[];          // populated for multi-intent responses
}

/** Strict JSON response contract */
export interface AgentResponse {
  response_message: string;
  sources: Source[];
  meta?: ResponseMeta;
  /** Optional UI hints (e.g. clarification mode) — safely ignored if not present */
  ui?: UiHint;
}

export interface DeliveryData {
  /** order_id from sheet (e.g. LG-240001) */
  order_id: string;
  /** Normalized status: Confirmed|Packed|In Transit|Out for Delivery|Delivered|Delayed|On Hold|Cancelled */
  current_status: string;
  status_detail?: string | null;
  /** ISO date YYYY-MM-DD from order_date_utc */
  order_date?: string | null;
  /** ISO date YYYY-MM-DD from promised_ship_date_utc */
  promised_ship_date?: string | null;
  /** ISO date YYYY-MM-DD from eta_utc */
  eta?: string | null;
  /** ISO date YYYY-MM-DD from delivered_utc */
  delivered_date?: string | null;
  /** carrier column */
  carrier?: string | null;
  /** tracking_no column → normalized as tracking_number */
  tracking_number?: string | null;
  customer_name?: string | null;
  ship_to_city?: string | null;
  country?: string | null;
  received_by?: string | null;
  /** product_name column */
  product?: string | null;
}

export interface AppointmentData {
  startDateTime: string;
  endDateTime: string;
  meetLink: string;
  title: string;
}

/** Returned by n8n when appointment fields are missing — triggers form card */
export interface AppointmentClarificationData {
  missing_fields: string[]; // e.g. ['email','date','time']
  prefill: {
    subject?: string;
    duration_min?: number;
    platform?: string;
    [key: string]: unknown;
  };
}

/** Optional UI hint returned alongside clarification responses */
export interface UiHint {
  mode: 'clarification' | string;
  missing_fields?: string[];
  prefill?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources: Source[];
  timestamp: Date;
  isError?: boolean;
  responseType?: IntentType;
  deliveryData?: DeliveryData | null;
  appointmentData?: AppointmentData | null;
  /** Populated when n8n returns clarification mode (missing fields) */
  appointmentClarificationData?: AppointmentClarificationData | null;
}

export interface DownloadHistoryEntry {
  title: string;
  doc_id: string;
  time: string;
}

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'error';
  text: string;
}

export interface DownloadPayload {
  doc_id: string;
  filename: string;
  file_url: string;
  email?: string;
}

/** Payload for emailing multiple documents at once */
export interface EmailAllPayload {
  email: string;
  files: Array<{ doc_id: string; filename: string; file_url: string }>;
}

