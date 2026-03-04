'use client';
import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatInputHistory } from '@/hooks/useChatInputHistory';

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
      <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}

export default function Composer({ onSend, disabled }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatHistory = useChatInputHistory();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [charCount, setCharCount] = useState(0);

  const autoSize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const submit = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const val = el.value.trim();
    if (!val || disabled) return;
    chatHistory.push(val);
    el.value = '';
    setCharCount(0);
    autoSize();
    onSend(val);
  }, [disabled, onSend, chatHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current!;
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
    const atEnd  = el.selectionStart === el.value.length;

    if (e.key === 'ArrowUp' && atStart) {
      e.preventDefault();
      const prev = chatHistory.up(el.value);
      el.value = prev; autoSize(); setCharCount(prev.length);
      setTimeout(() => el.setSelectionRange(prev.length, prev.length), 0);
      return;
    }
    if (e.key === 'ArrowDown' && atEnd) {
      e.preventDefault();
      const next = chatHistory.down();
      el.value = next; autoSize(); setCharCount(next.length);
      setTimeout(() => el.setSelectionRange(next.length, next.length), 0);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else {
      requestAnimationFrame(autoSize);
    }
  };

  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 520);
  };

  return (
    <div style={{ flexShrink: 0, padding: '6px 0 10px', background: 'transparent' }}>
      <motion.div
        className="composer-root glass"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '6px 8px 8px 4px' }}>
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            rows={1}
            placeholder="Ask about gas products, pricing, delivery status…"
            onKeyDown={handleKeyDown}
            onChange={e => { autoSize(); setCharCount(e.target.value.length); }}
            disabled={disabled}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            {/* Char count with warning colors */}
            <AnimatePresence>
              {charCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={charCount > 800 ? 'char-danger' : charCount > 500 ? 'char-warn' : ''}
                  style={{ fontSize: 10, color: charCount > 800 ? undefined : charCount > 500 ? undefined : 'var(--muted)', fontWeight: 600, lineHeight: 1 }}
                >
                  {charCount}{charCount > 500 ? '/1000' : ''}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              className="send-btn"
              onClick={(e) => { addRipple(e); submit(); }}
              disabled={disabled}
              type="button"
              whileTap={{ scale: 0.93 }}
            >
              {/* Ripples */}
              {ripples.map(r => (
                <span
                  key={r.id}
                  className="ripple"
                  style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
                />
              ))}
              {disabled ? <LoadingSpinner /> : <SendIcon />}
              <span>{disabled ? 'Thinking…' : 'Send'}</span>
            </motion.button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div style={{ paddingLeft: 14, paddingBottom: 7, paddingRight: 14, fontSize: 11, color: 'var(--muted)', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <span>
            <kbd style={{ fontFamily: 'inherit', background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Enter</kbd>{' '}send
            {' · '}
            <kbd style={{ fontFamily: 'inherit', background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>⇧Enter</kbd>{' '}newline
            {' · '}
            <kbd style={{ fontFamily: 'inherit', background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>↑↓</kbd>{' '}history
          </span>
        </div>
      </motion.div>
    </div>
  );
}
