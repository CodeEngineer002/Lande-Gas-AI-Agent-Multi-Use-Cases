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
}

/** Strict JSON response contract */
export interface AgentResponse {
  response_message: string;
  sources: Source[];
  meta?: ResponseMeta;
}

export interface DeliveryData {
  current_status: string;
  order_number: string;
  shipped_via: string;
  expected_date: string;
}

export interface AppointmentData {
  startDateTime: string;
  endDateTime: string;
  meetLink: string;
  title: string;
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

