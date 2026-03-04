'use client';
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Toast } from '@/lib/types';

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (type: Toast['type'], text: string, autocloseMs = 3000): (() => void) => {
      const id = uuidv4();
      setToasts(prev => [...prev, { id, type, text }]);
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        setToasts(prev => prev.filter(t => t.id !== id));
      };
      if (autocloseMs > 0) setTimeout(close, autocloseMs);
      return close;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
