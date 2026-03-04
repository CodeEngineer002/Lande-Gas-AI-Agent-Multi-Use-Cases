'use client';
import { useCallback, useReducer, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, Source, IntentType, ResponseMeta } from '@/lib/types';
import {
  isGreeting,
  extractDeliveryData,
  extractAppointmentData,
} from '@/lib/utils';

// ── State ──────────────────────────────────────────────────────────────────
interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  lastSources: Source[];
  sessionId: string;
  lastMeta: ResponseMeta | null;
}

type Action =
  | { type: 'ADD_USER'; payload: ChatMessage }
  | { type: 'ADD_ASSISTANT'; payload: ChatMessage }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_LAST_SOURCES'; payload: Source[] }
  | { type: 'SET_LAST_META'; payload: ResponseMeta | null }
  | { type: 'CLEAR' };

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'ADD_USER':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'ADD_ASSISTANT':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        lastSources: action.payload.sources,
      };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'SET_LAST_SOURCES':
      return { ...state, lastSources: action.payload };
    case 'SET_LAST_META':
      return { ...state, lastMeta: action.payload };
    case 'CLEAR':
      return { ...state, messages: [], lastSources: [], lastMeta: null };
    default:
      return state;
  }
}

const WELCOME =
  "Hi! Welcome to Linde Gas AI Agent. Ask about any product from Linde Product Data Sheets—properties, safety, handling, specs, and more. You can also check delivery status, get quotations, or schedule a meeting with our team.";

const CHAT_ERROR = 'Something went wrong. Please retry or rephrase your query.';

// ── Hook ───────────────────────────────────────────────────────────────────
export function useChat() {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    isTyping: false,
    lastSources: [],
    lastMeta: null,
    sessionId: typeof crypto !== 'undefined' ? crypto.randomUUID() : uuidv4(),
  });

  const sessionIdRef = useRef(state.sessionId);

  // Add the initial welcome message once (called from component on mount)
  const initWelcome = useCallback(() => {
    dispatch({
      type: 'ADD_ASSISTANT',
      payload: {
        id: uuidv4(),
        role: 'assistant',
        text: WELCOME,
        sources: [],
        timestamp: new Date(),
        responseType: 'greeting',
      },
    });
  }, []);

  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const send = useCallback(async (text: string, email?: string) => {
    if (!text.trim()) return;

    // Add user message
    dispatch({
      type: 'ADD_USER',
      payload: {
        id: uuidv4(),
        role: 'user',
        text: text.trim(),
        sources: [],
        timestamp: new Date(),
      },
    });

    dispatch({ type: 'SET_TYPING', payload: true });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionId: sessionIdRef.current,
          ...(email ? { email } : {}),
        }),
      });

      const data = await res.json() as {
        response_message?: string;
        message?: string;
        sources?: Source[];
        meta?: { confidence?: number | null; sources_used?: number };
      };

      const answer = data.response_message || data.message || CHAT_ERROR;
      const rawSources: Source[] = Array.isArray(data.sources) ? data.sources : [];

      // Capture meta (confidence + sources_used)
      const metaRaw = data.meta;
      const responseMeta: ResponseMeta = {
        confidence: typeof metaRaw?.confidence === 'number' ? metaRaw.confidence : null,
        sources_used: typeof metaRaw?.sources_used === 'number' ? metaRaw.sources_used : rawSources.length,
      };
      dispatch({ type: 'SET_LAST_META', payload: responseMeta });

      // Frontend safety net: suppress sources when the LLM signals it couldn't
      // find the requested data (prevents showing an irrelevant RAG document),
      // or when it's asking the user to clarify / provide more info.
      const NOT_FOUND_PHRASES = [
        "couldn't find", "could not find", "not found", "no information",
        "i don't have", "unable to find", "not present in", "not available in",
        "doesn't contain", "does not contain", "cannot find",
        "not in the provided", "not mentioned", "not specified",
      ];
      const CLARIFICATION_PHRASES = [
        "please provide", "could you please provide", "could you provide",
        "please share your", "please share the", "what is your order",
        "please confirm", "can you provide", "can you share",
        "please let me know", "kindly provide", "kindly share",
      ];
      const lowerAnswer = answer.toLowerCase();
      const sources: Source[] = (
        NOT_FOUND_PHRASES.some(p => lowerAnswer.includes(p)) ||
        CLARIFICATION_PHRASES.some(p => lowerAnswer.includes(p))
      )
        ? []
        : rawSources;

      // Determine response type
      let responseType: IntentType = '';
      if (sources.length > 0 && sources[0].type) {
        responseType = sources[0].type as IntentType;
      } else if (isGreeting(text)) {
        responseType = 'greeting';
      }

      // Coerce delivery queries
      const lq = text.toLowerCase();
      if (
        responseType === 'delivery_update' ||
        responseType === 'delivery_status' ||
        lq.includes('delivery') ||
        lq.includes('track') ||
        lq.includes('order status') ||
        lq.includes('shipment')
      ) {
        responseType = 'delivery_status';
      }

      // Coerce appointment queries
      if (
        responseType === 'appointment' ||
        lq.includes('call') ||
        lq.includes('meeting') ||
        lq.includes('appointment') ||
        lq.includes('schedule')
      ) {
        responseType = 'appointment';
      }

      const rawDelivery =
        responseType === 'delivery_status' ? extractDeliveryData(answer) : null;
      // Only show the DeliveryTracking card when actual order data was found.
      // If the agent is asking for an order number, rawDelivery fields will be
      // empty — in that case we suppress the widget.
      const deliveryData =
        rawDelivery && (rawDelivery.current_status || rawDelivery.order_number)
          ? rawDelivery
          : null;
      const appointmentData =
        responseType === 'appointment' ? extractAppointmentData(answer, sources) : null;

      dispatch({
        type: 'ADD_ASSISTANT',
        payload: {
          id: uuidv4(),
          role: 'assistant',
          text: answer,
          sources,
          timestamp: new Date(),
          responseType,
          deliveryData,
          appointmentData,
        },
      });
    } catch (err) {
      console.error('[useChat] send error:', err);
      dispatch({ type: 'SET_LAST_META', payload: null });
      dispatch({
        type: 'ADD_ASSISTANT',
        payload: {
          id: uuidv4(),
          role: 'assistant',
          text: CHAT_ERROR,
          sources: [],
          timestamp: new Date(),
          isError: true,
        },
      });
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false });
    }
  }, []);

  return { state, send, clear, initWelcome };
}
