'use client';
import { useRef, useEffect } from 'react';

const HISTORY_KEY = 'linde_chat_history';

export function useChatInputHistory() {
  const history = useRef<string[]>([]);
  const idxRef  = useRef<number>(0);
  const lastTyped = useRef<string>('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(saved)) {
        history.current = saved;
        idxRef.current = saved.length;
      }
    } catch { /* ignore */ }
  }, []);

  const push = (value: string) => {
    if (!value) return;
    const h = history.current;
    if (h[h.length - 1] === value) { idxRef.current = h.length; return; }
    h.push(value);
    if (h.length > 200) history.current = h.slice(-200);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.current));
    idxRef.current = history.current.length;
  };

  const up = (currentVal: string): string => {
    if (idxRef.current === history.current.length) lastTyped.current = currentVal;
    const next = Math.max(0, idxRef.current - 1);
    idxRef.current = next;
    return history.current[next] || '';
  };

  const down = (): string => {
    const next = Math.min(history.current.length, idxRef.current + 1);
    idxRef.current = next;
    return next === history.current.length ? lastTyped.current : (history.current[next] || '');
  };

  return { push, up, down };
}
