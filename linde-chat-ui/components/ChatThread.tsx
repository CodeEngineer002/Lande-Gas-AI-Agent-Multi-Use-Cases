'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage, DownloadPayload } from '@/lib/types';
import MessageBubble from './MessageBubble';

interface ChatThreadProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onDownload: (payload: DownloadPayload) => void;
  onEmailFirstSource: (sources: ChatMessage['sources']) => void;
}

function TypingIndicator() {
  return (
    <motion.div
      key="typing"
      className="typing-wrapper"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* AI avatar */}
      <div style={{
        width: 32, height: 32,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, var(--brand-2), var(--brand))',
        color: '#fff',
        fontSize: 10,
        fontWeight: 900,
        flexShrink: 0,
        boxShadow: 'var(--shadow-brand)',
        border: '2px solid rgba(255,255,255,0.35)',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M5 14v2a1 1 0 0 0 1 1h1v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3h1a1 1 0 0 0 1-1v-2H5m9-3a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1m-4 0a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1z"/>
        </svg>
      </div>

      <div className="typing-bubble">
        {[0, 0.18, 0.36].map((delay, i) => (
          <span key={i} className="typing-dot" style={{ animationDelay: `${delay}s` }} />
        ))}
        <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 6, fontWeight: 500 }}>
          Thinking…
        </span>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'backOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 14,
        opacity: 0.7,
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 64, height: 64,
          borderRadius: 20,
          background: 'linear-gradient(135deg, var(--brand-2), var(--brand))',
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'var(--shadow-brand)',
          border: '2px solid rgba(255,255,255,0.4)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </motion.div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>
          Ask Linde AI Agent
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 300 }}>
          Get product datasheets, check delivery status, request quotes, or schedule a call with a sales rep.
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatThread({
  messages, isTyping, onDownload, onEmailFirstSource,
}: ChatThreadProps) {
  const threadRef = useRef<HTMLDivElement>(null);
  const [showToBottom, setShowToBottom] = useState(false);

  const nearBottom = () => {
    const t = threadRef.current;
    if (!t) return true;
    return (t.scrollHeight - t.scrollTop - t.clientHeight) < 140;
  };

  useEffect(() => {
    if (nearBottom() && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isTyping]);

  const handleScroll = () => setShowToBottom(!nearBottom());

  const scrollToBottom = () => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
    setShowToBottom(false);
  };

  const hasMessages = messages.some(m => m.role !== 'assistant' || messages.length > 1);

  return (
    <>
      <div
        ref={threadRef}
        className="thread glass border-grad"
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 14px 8px',
          borderRadius: 18,
          position: 'relative',
        }}
      >
        {/* Empty state — only if no user messages */}
        {messages.length === 0 && <EmptyState />}

        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onDownload={onDownload}
              onEmailFirstSource={onEmailFirstSource}
            />
          ))}

          <AnimatePresence>
            {isTyping && <TypingIndicator />}
          </AnimatePresence>
        </div>
      </div>

      {/* Scroll-to-bottom */}
      <AnimatePresence>
        {showToBottom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 12 }}
            transition={{ duration: 0.22, ease: 'backOut' }}
            style={{
              position: 'fixed',
              right: 24,
              bottom: 90,
              zIndex: 40,
            }}
          >
            <motion.button
              className="scroll-to-bottom"
              onClick={scrollToBottom}
              whileTap={{ scale: 0.88 }}
              title="Scroll to latest"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
