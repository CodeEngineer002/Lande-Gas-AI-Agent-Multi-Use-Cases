'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ChatMessage, DownloadPayload, Source } from '@/lib/types';
import { mdLite } from '@/lib/utils';
import SourceChips from '@/components/SourceChips';
import DeliveryTracking from '@/components/DeliveryTracking';
import AppointmentCard from '@/components/AppointmentCard';

const APP_NAME = 'Linde Gas AI';
const USER_NAME = 'Mr. Bond';
const userInitials = USER_NAME.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

export interface MessageBubbleProps {
  message: ChatMessage;
  onDownload: (payload: DownloadPayload) => void;
  onEmailFirstSource: (sources: Source[]) => void;
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  );
}

function RobotIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M5 14v2a1 1 0 0 0 1 1h1v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3h1a1 1 0 0 0 1-1v-2H5m9-3a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1m-4 0a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1z"/>
    </svg>
  );
}

function ts(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, onDownload, onEmailFirstSource }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const bodyHtml = useMemo(() => mdLite(message.text), [message.text]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: 'flex',
        gap: 10,
        padding: '6px 0',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar — left side for AI */}
      {!isUser && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.22, ease: 'backOut' }}
          style={{
            width: 32, height: 32,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, var(--brand-2), var(--brand))',
            color: '#fff',
            fontWeight: 900,
            fontSize: 11,
            flexShrink: 0,
            marginTop: 4,
            boxShadow: 'var(--shadow-brand)',
            border: '2px solid rgba(255,255,255,0.35)',
          }}
        >
          <RobotIcon />
        </motion.div>
      )}

      {/* Bubble */}
      <div
        className={`bubble${isUser ? ' user-bubble' : ''}`}
        style={{ maxWidth: isUser ? '78%' : '100%' }}
      >
        {/* Bubble header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 8,
          fontWeight: 700,
          fontSize: 13,
          color: isUser ? 'var(--brand)' : 'var(--brand-2)',
        }}>
          <span style={{ opacity: 0.85 }}>
            {isUser ? USER_NAME : APP_NAME}
          </span>
          {message.isError && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 99,
              background: 'rgba(239,68,68,0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.25)',
            }}>
              Error
            </span>
          )}
        </div>

        {/* Body */}
        <div
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
          style={{ color: message.isError ? '#991b1b' : 'var(--ink)' }}
        />

        {/* Rich cards/chips below body */}
        {!isUser && (
          <SourceChips
            sources={message.sources}
            responseType={message.responseType}
            onDownload={onDownload}
          />
        )}
        {!isUser && message.responseType === 'delivery_status' && message.deliveryData && (
          <DeliveryTracking data={message.deliveryData} />
        )}
        {!isUser && message.responseType === 'appointment' && message.appointmentData && (
          <AppointmentCard data={message.appointmentData} />
        )}

        {/* Footer: time + actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 10,
          color: 'var(--muted)',
          fontSize: 11.5,
        }}>
          <span style={{ opacity: 0.75 }}>{ts(message.timestamp)}</span>

          {!isUser && (
            <div style={{ display: 'flex', gap: 5 }}>
              <motion.button
                className="bubble-action"
                title={copied ? 'Copied!' : 'Copy response'}
                onClick={handleCopy}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.1 }}
                style={copied ? { color: '#10b981', borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)' } : {}}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </motion.button>

              {message.sources.length > 0 && (
                <motion.button
                  className="bubble-action"
                  title="Email document"
                  onClick={() => onEmailFirstSource(message.sources)}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <EmailIcon />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar — right side for User */}
      {isUser && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.22, ease: 'backOut' }}
          style={{
            width: 32, height: 32,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, #5cb6ff, var(--brand))',
            color: '#fff',
            fontWeight: 900,
            fontSize: 12,
            flexShrink: 0,
            marginTop: 4,
            border: '2px solid rgba(255,255,255,0.4)',
            boxShadow: '0 4px 12px rgba(0,111,191,0.25)',
          }}
        >
          {userInitials}
        </motion.div>
      )}
    </motion.div>
  );
}
