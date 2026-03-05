'use client';
import { useRef, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatInputHistory } from '@/hooks/useChatInputHistory';
import { useSettings } from '@/lib/settingsContext';

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export interface ComposerHandle {
  focus: () => void;
  setValue: (text: string) => void;
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
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

const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { onSend, disabled },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatHistory = useChatInputHistory();
  const { settings } = useSettings();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [charCount, setCharCount] = useState(0);

  // Expose focus() and setValue() to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      const el = textareaRef.current;
      if (!el) return;
      // Only focus if nothing else has user focus (don't steal from links, buttons, etc.)
      const active = document.activeElement;
      const isInputFocused = active instanceof HTMLInputElement
        || active instanceof HTMLTextAreaElement
        || active instanceof HTMLSelectElement;
      if (isInputFocused && active !== el) return;
      el.focus({ preventScroll: true });
    },
    setValue: (text: string) => {
      const el = textareaRef.current;
      if (!el) return;
      el.value = text;
      setCharCount(text.length);
      // Inline auto-resize (autoSize const defined below)
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
      el.focus({ preventScroll: true });
      // Place cursor at end
      requestAnimationFrame(() => el.setSelectionRange(text.length, text.length));
    },
  }), []);

  // Auto-focus on mount — desktop only, gated by autoFocusInput setting
  useEffect(() => {
    if (!settings.autoFocusInput) return;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      || window.innerWidth < 768;
    if (!isMobile) {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, [settings.autoFocusInput]);

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '8px 10px 8px 8px' }}>
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            rows={1}
            placeholder="Ask Linde Gas AI a question…"
            onKeyDown={handleKeyDown}
            onChange={e => { autoSize(); setCharCount(e.target.value.length); }}
            disabled={disabled}
          />

          {/* Right-side controls */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            {/* Char count */}
            <AnimatePresence>
              {charCount > 500 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={charCount > 800 ? 'char-danger' : 'char-warn'}
                  style={{ fontSize: 10, fontWeight: 600, alignSelf: 'center', lineHeight: 1 }}
                >
                  {charCount}/1000
                </motion.div>
              )}
            </AnimatePresence>

            {/* Paperclip attachment button — right side */}
            <motion.button
              className="composer-attach-btn"
              type="button"
              title="Attach file (coming soon)"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {}}
            >
              <PaperclipIcon />
            </motion.button>

            {/* Circle send button */}
            <motion.button
              className="send-btn"
              onClick={(e) => { addRipple(e); submit(); }}
              disabled={disabled}
              type="button"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              title={disabled ? 'Sending…' : 'Send (Enter)'}
            >
              {ripples.map(r => (
                <span
                  key={r.id}
                  className="ripple"
                  style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
                />
              ))}
              {disabled ? <LoadingSpinner /> : <SendIcon />}
            </motion.button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div style={{ paddingLeft: 14, paddingBottom: 7, paddingRight: 14, fontSize: 11, opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
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
});

export default Composer;
