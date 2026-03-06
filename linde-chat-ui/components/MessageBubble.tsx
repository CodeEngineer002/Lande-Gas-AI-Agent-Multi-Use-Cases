'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ChatMessage, DownloadPayload, Source } from '@/lib/types';
import { mdLite, copyToClipboard } from '@/lib/utils';
import SourceChips from '@/components/SourceChips';
import DeliveryTracking from '@/components/DeliveryTracking';
import AppointmentCard from '@/components/AppointmentCard';
import AppointmentClarificationCard from '@/components/AppointmentClarificationCard';
import { useSettings } from '@/lib/settingsContext';

const APP_NAME = 'Linde Gas AI Assistant';
const USER_NAME = 'Prateek Bais';

export interface MessageBubbleProps {
  message: ChatMessage;
  onDownload: (payload: DownloadPayload) => void;
  onEmailFirstSource: (sources: Source[]) => void;
  onEmailDelivery?: (deliveryData: ChatMessage['deliveryData']) => void;
  onSend?: (text: string) => void;
  isTyping?: boolean;
  index?: number;
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

function ts(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, onDownload, onEmailFirstSource, onEmailDelivery, onSend, isTyping, index = 0 }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const bodyHtml = useMemo(() => mdLite(message.text), [message.text]);
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();
  const delay = Math.min(index * 0.03, 0.18);

  // Response format gating
  const hasStructured = !isUser && (
    (message.responseType === 'delivery_status' && !!message.deliveryData) ||
    (message.responseType === 'appointment' && (!!message.appointmentData || !!message.appointmentClarificationData))
  );
  const showNatural    = settings.responseFormat !== 'structured' || !hasStructured;
  const showStructured = settings.responseFormat !== 'natural';

  // User initials from USER_NAME
  const initials = USER_NAME.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleCopy = () => {
    copyToClipboard(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {
      // silently fail — don't crash on unsupported browsers
    });
  };

  return (
    <>
      <motion.div
        className={`chat-msg-group ${isUser ? 'user' : 'ai'}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {/* Role label */}
        {/* <div className="chat-role-label">
          {isUser ? 'User' : 'Bot'}
        </div> */}

        {/* AI meta row: avatar + name + time */}
        {!isUser && (
          <div className="chat-ai-meta">
            <div className="chat-linde-av">L</div>
            <span className="chat-ai-name">{APP_NAME}</span>
            {/* <span className="chat-ai-time">{ts(message.timestamp)}</span> */}
          </div>
        )}

        {/* User meta row: name + time + avatar (right-aligned) */}
        {isUser && (
          <div className="chat-user-meta">
            <span className="chat-user-name">{USER_NAME}</span>
            {/* <span className="chat-ai-time">{ts(message.timestamp)}</span> */}
            <div className="chat-user-av">{initials}</div>
          </div>
        )}

        {/* Bubble / Card */}
        <div className={`chat-bubble ${isUser ? 'user' : 'ai'}`}>
          {message.isError && (
            <span className="chat-error-badge">Error</span>
          )}
          {showNatural && (
            <div
              className="chat-bubble-body"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          )}
          {!isUser && (
            <SourceChips
              sources={message.sources}
              responseType={message.responseType}
              onDownload={onDownload}
            />
          )}
          {showStructured && !isUser && message.responseType === 'delivery_status' && message.deliveryData && (
            <DeliveryTracking data={message.deliveryData} />
          )}
          {showStructured && !isUser && message.responseType === 'appointment' && message.appointmentClarificationData && (
            <AppointmentClarificationCard
              data={message.appointmentClarificationData}
              onSend={onSend ?? (() => {})}
            />
          )}
          {showStructured && !isUser && message.responseType === 'appointment' && message.appointmentData && message.appointmentData.startDateTime && (
            <AppointmentCard data={message.appointmentData} />
          )}

          {/* Footer: copy + email (both user and AI) */}
          <div className="chat-bubble-ftr">
            <span className="chat-bubble-ts">{ts(message.timestamp)}</span>
            <div className="chat-bubble-actions">
              <motion.button
                className="bubble-action"
                title={copied ? 'Copied!' : 'Copy'}
                onClick={handleCopy}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.1 }}
                style={copied ? { color: '#10b981', borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)' } : {}}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </motion.button>
              {!isUser && (message.sources.length > 0 || (message.responseType === 'delivery_status' && !!message.deliveryData)) && (
                <motion.button
                  className="bubble-action"
                  title={message.responseType === 'delivery_status' && message.deliveryData ? 'Email tracking snapshot' : 'Email document'}
                  onClick={() => {
                    if (message.responseType === 'delivery_status' && message.deliveryData) {
                      onEmailDelivery?.(message.deliveryData);
                    } else {
                      onEmailFirstSource(message.sources);
                    }
                  }}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <EmailIcon />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

    </>
  );
}

