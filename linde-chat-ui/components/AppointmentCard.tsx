'use client';
import { motion } from 'framer-motion';
import type { AppointmentData } from '@/lib/types';

interface AppointmentCardProps {
  data: AppointmentData;
}

function formatDateTime(startISO: string, endISO: string) {
  if (!startISO) return { date: 'Friday, November 11, 2025', time: '12:00 PM – 1:00 PM CET' };
  try {
    const start = new Date(startISO);
    const end   = endISO ? new Date(endISO) : null;
    const date  = start.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const time = end ? `${fmt(start)} – ${fmt(end)} CET` : `${fmt(start)} CET`;
    return { date, time };
  } catch {
    return { date: '', time: '' };
  }
}

function VideoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  );
}

function CalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 16H5V8h14v11z"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

export default function AppointmentCard({ data }: AppointmentCardProps) {
  const { date, time } = formatDateTime(data.startDateTime, data.endDateTime);
  const title = data.title || 'Sales consultation with Linde representative';

  return (
    <motion.div
      className="appointment-confirmation"
      initial={{ opacity: 0, scale: 0.85, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Gradient header */}
      <div className="appointment-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: 'backOut' }}
            style={{
              width: 44, height: 44,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.35)',
              fontSize: 20,
              backdropFilter: 'blur(10px)',
            }}
          >
            ✓
          </motion.div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.2px' }}>
              Meeting Confirmed
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>
              Your consultation is scheduled
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="appointment-body">
        {/* Title */}
        <div style={{
          fontWeight: 700,
          fontSize: 15,
          color: 'var(--ink)',
          textAlign: 'center',
          marginBottom: 16,
          lineHeight: 1.4,
        }}>
          {title}
        </div>

        {/* Date / Time chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'DATE', value: date || 'TBC', emoji: '📅' },
            { label: 'TIME', value: time || 'TBC', emoji: '⏰' },
          ].map(({ label, value, emoji }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.25 }}
              style={{
                textAlign: 'center',
                padding: '14px 10px',
                background: 'rgba(0,111,191,0.05)',
                borderRadius: 12,
                border: '1px solid rgba(0,111,191,0.12)',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', lineHeight: 1.35 }}>
                {value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.meetLink && (
            <motion.a
              href={data.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="meet-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.28, ease: 'backOut' }}
              style={{ justifyContent: 'center' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <VideoIcon />
              Join Google Meet
            </motion.a>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { icon: <CalIcon />, label: 'Add to Calendar' },
              { icon: <MailIcon />, label: 'Email Reminder' },
            ].map(({ icon, label }) => (
              <motion.button
                key={label}
                whileHover={{ y: -1, background: 'rgba(0,111,191,0.07)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '9px 12px',
                  background: 'transparent',
                  color: 'var(--muted)',
                  border: '1.5px solid var(--assistBorder)',
                  borderRadius: 9,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
              >
                {icon} {label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: 14,
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--muted)',
          fontStyle: 'italic',
          borderTop: '1px solid var(--assistBorder)',
          paddingTop: 12,
        }}>
          ✉️ A calendar invitation has been sent to your email
        </div>
      </div>
    </motion.div>
  );
}
