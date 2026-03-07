'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage, DownloadPayload, Source } from '@/lib/types';
import MessageBubble from './MessageBubble';

interface ChatThreadProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onDownload: (payload: DownloadPayload) => void;
  onDownloadAll: (sources: Source[]) => void;
  onEmailFirstSource: (sources: ChatMessage['sources']) => void;
  onEmailDelivery?: (deliveryData: ChatMessage['deliveryData']) => void;
  onSend?: (text: string) => void;
  searchQuery?: string;
  conversationTitle?: string;
}

function TypingIndicator() {
  return (
    <motion.div
      key="typing"
      className="typing-wrapper"
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="msg-av msg-av-ai" style={{ flexShrink: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M5 14v2a1 1 0 0 0 1 1h1v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3h1a1 1 0 0 0 1-1v-2H5m9-3a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1m-4 0a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1z"/>
        </svg>
      </div>
      <div className="typing-card">
        <div className="typing-card-hdr">
          <span className="typing-sender">Linde Gas AI</span>
          <span className="typing-status-badge">
            <span className="typing-pulse-ring" />
            Processing
          </span>
        </div>
        <div className="typing-dots-row">
          {[0, 0.15, 0.3].map((delay, i) => (
            <span key={i} className="typing-dot" style={{ animationDelay: `${delay}s` }} />
          ))}
          <span className="typing-label">Analyzing your query…</span>
        </div>
      </div>
    </motion.div>
  );
}

function formatDateLabel(d: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function DateSeparator({ label }: { label: string }) {
  return (
    <motion.div
      className="chat-date-sep"
      initial={{ opacity: 0, scaleX: 0.7 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <span className="chat-date-sep-label">{label}</span>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className="chat-empty-state"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Concentric rings */}
      <div className="chat-empty-rings">
        <motion.div className="empty-ring empty-ring-3"
          animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.08, 0.15] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div className="empty-ring empty-ring-2"
          animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.14, 0.25] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        <motion.div className="empty-ring empty-ring-1"
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.22, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
        />
        <motion.div
          className="empty-icon-wrap"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </motion.div>
      </div>
      <div className="chat-empty-text">
        <div className="chat-empty-title">Ask Linde Gas AI Agent</div>
        <div className="chat-empty-sub">Get product datasheets, check delivery status,<br/>request quotes, or schedule a sales call.</div>
      </div>
      <div className="chat-empty-chips">
        {['Product Datasheet', 'Delivery Status', 'Request Quote'].map((label, i) => (
          <motion.div
            key={label}
            className="chat-empty-chip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.28 }}
          >
            {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ChatThread({
  messages, isTyping, onDownload, onDownloadAll, onEmailFirstSource, onEmailDelivery, onSend, searchQuery, conversationTitle,
}: ChatThreadProps) {
  const threadRef = useRef<HTMLDivElement>(null);
  const [showToBottom, setShowToBottom] = useState(false);
  const prevLengthRef = useRef(messages.length);

  // Filter messages based on search query
  const displayMessages = searchQuery
    ? messages.filter(m =>
        m.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const nearBottom = () => {
    const t = threadRef.current;
    if (!t) return true;
    return (t.scrollHeight - t.scrollTop - t.clientHeight) < 140;
  };

  const scrollToEnd = (smooth = false) => {
    const t = threadRef.current;
    if (!t) return;
    if (smooth) {
      t.scrollTo({ top: t.scrollHeight, behavior: 'smooth' });
    } else {
      t.scrollTop = t.scrollHeight;
    }
  };

  useEffect(() => {
    const newLength = messages.length;
    const grew = newLength > prevLengthRef.current;
    prevLengthRef.current = newLength;

    if (!threadRef.current) return;

    if (grew) {
      // Always scroll to bottom when a new message arrives (user or assistant)
      const lastMsg = messages[newLength - 1];
      if (lastMsg?.role === 'user') {
        // User just sent — hard jump so the typing indicator is immediately visible
        scrollToEnd(false);
      } else {
        // Assistant replied — smooth scroll to bottom
        scrollToEnd(true);
      }
    } else if (isTyping && nearBottom()) {
      // Typing indicator appeared while already near bottom
      scrollToEnd(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isTyping]);

  const handleScroll = () => setShowToBottom(!nearBottom());

  const scrollToBottom = () => {
    scrollToEnd(true);
    setShowToBottom(false);
  };

  return (
    <div className="chat-thread-wrap">
      {/* Conversation Title Bar */}
      <div className="chat-title-bar">
        <div className="chat-title-left">
          <span className="chat-title-text">
            {'Chat with Linde Gas AI Agent' /*conversationTitle || 'New Conversation'*/}
          </span>
          {searchQuery && (
            <span className="chat-title-search-badge">
              {displayMessages.length} result{displayMessages.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
            </span>
          )}
        </div>
        <div className="chat-title-actions">
          <button className="chat-title-btn" title="Edit conversation title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className="chat-title-btn" title="More options">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

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
          padding: '12px 20px 32px',
          borderRadius: 18,
          position: 'relative',
        }}
      >
        {/* Empty state — only if no messages */}
        {messages.length === 0 && <EmptyState />}

        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {displayMessages.map((msg, i) => {
            const showDateSep = i === 0 || (
              formatDateLabel(msg.timestamp) !== formatDateLabel(displayMessages[i - 1].timestamp)
            );
            return (
              <div key={msg.id}>
                {showDateSep && <DateSeparator label={formatDateLabel(msg.timestamp)} />}
                <MessageBubble
                  message={msg}
                  onDownload={onDownload}
                  onDownloadAll={onDownloadAll}
                  onEmailFirstSource={onEmailFirstSource}
                  onEmailDelivery={onEmailDelivery}
                  onSend={onSend}
                  isTyping={isTyping}
                  index={i}
                />
              </div>
            );
          })}

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
    </div>
  );
}
