'use client';
import React from 'react';
import { motion } from 'framer-motion';
import type { AppointmentData } from '@/lib/types';

// ─────────── PREMIUM REWRITE ──────────────────────────────────────────────

interface AppointmentCardProps {
  data: AppointmentData;
}

function formatDateTime(startISO: string, endISO: string) {
  if (!startISO) return { date: '', time: '', dayNum: '', monthShort: '', dayShort: '' };
  try {
    const start = new Date(startISO);
    const end   = endISO ? new Date(endISO) : null;
    const date  = start.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const dayNum    = start.toLocaleDateString('en-US', { day: 'numeric' });
    const monthShort = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const dayShort  = start.toLocaleDateString('en-US', { weekday: 'short' });
    const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const time = end ? `${fmt(start)} – ${fmt(end)} CET` : `${fmt(start)} CET`;
    return { date, time, dayNum, monthShort, dayShort };
  } catch {
    return { date: '', time: '', dayNum: '', monthShort: '', dayShort: '' };
  }
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function MeetIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  );
}

function CalIconSm() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 16H5V8h14v11z"/>
    </svg>
  );
}

function MailIconSm() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

/* ─── Reusable row item ─── */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="ac-info-row" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      borderRadius: 10,
      background: 'rgba(0,111,191,0.07)',
      border: '1px solid rgba(0,111,191,0.13)',
    }}>
      <div className="ac-info-icon" style={{
        width: 32, height: 32,
        borderRadius: 9,
        background: 'rgba(0,111,191,0.15)',
        display: 'grid',
        placeItems: 'center',
        color: '#7ab8e8',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div className="ac-info-label" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(100,160,220,0.55)', marginBottom: 2 }}>
          {label}
        </div>
        <div className="ac-info-value" style={{ fontSize: 13, fontWeight: 700, color: '#cde4f8', lineHeight: 1.35 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function AppointmentCard({ data }: AppointmentCardProps) {
  const { date, time, dayNum, monthShort, dayShort } = formatDateTime(data.startDateTime, data.endDateTime);
  const title = data.title || 'Sales Consultation — Linde Gas';

  return (
    <motion.div
      className="ac-root"
      initial={{ opacity: 0, y: 20, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        marginTop: 12,
        maxWidth: 400,
        borderRadius: 18,
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #080f1e 0%, #0b1a30 55%, #070d1b 100%)',
        border: '1px solid rgba(0,122,200,0.2)',
        boxShadow: '0 0 0 1px rgba(0,122,200,0.07), 0 28px 56px rgba(0,0,0,0.6), 0 0 60px rgba(0,90,170,0.07)',
        fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      {/* Top gradient accent bar */}
      <div className="ac-accent-bar" style={{
        height: 3,
        background: 'linear-gradient(90deg, #006FBF, #00b5e2, #0047ab, #006FBF)',
        backgroundSize: '300% 100%',
        animation: 'gradientShift 4s ease infinite',
      }} />

      {/* ── HERO HEADER ──────────────────────────── */}
      <div style={{
        padding: '22px 22px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
      }}>
        {/* Glow blob behind checkmark */}
        <div style={{
          position: 'absolute',
          top: 8, left: 8,
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,196,122,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Animated success badge */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: 'backOut' }}
          style={{ position: 'relative', flexShrink: 0, zIndex: 1 }}
        >
          {/* Outer pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{
              position: 'absolute', inset: -10,
              borderRadius: '50%',
              border: '1.5px solid rgba(0,196,122,0.45)',
            }}
          />
          {/* Middle ring */}
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            style={{
              position: 'absolute', inset: -5,
              borderRadius: '50%',
              border: '1px solid rgba(0,196,122,0.3)',
            }}
          />
          <div style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #00c47a, #009960)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 4px 24px rgba(0,190,120,0.45), 0 0 0 1px rgba(0,196,122,0.3)',
          }}>
            <CheckIcon />
          </div>
        </motion.div>

        {/* Text */}
        <div style={{ zIndex: 1 }}>
          <div style={{
            fontSize: 9.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: '#00b5e2',
            marginBottom: 4,
          }}>
            LINDE GAS
          </div>
          <div className="ac-title" style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#e8f4ff',
            letterSpacing: '-0.4px',
            lineHeight: 1.15,
          }}>
            Meeting Confirmed
          </div>
          <div className="ac-subtitle" style={{
            fontSize: 12,
            color: 'rgba(150,200,240,0.55)',
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{
                display: 'inline-block',
                width: 6, height: 6,
                borderRadius: '50%',
                background: '#00b5e2',
                boxShadow: '0 0 8px #00b5e2',
                flexShrink: 0,
              }}
            />
            Invite sent · Meeting link ready
          </div>
        </div>
      </div>

      {/* ── SEPARATOR ────────────────────────────── */}
      <div className="ac-separator" style={{
        height: 1,
        margin: '0 22px',
        background: 'linear-gradient(90deg, transparent, rgba(0,111,200,0.22), transparent)',
      }} />

      {/* ── TITLE ─────────────────────────────────── */}
      <div style={{ padding: '14px 22px 4px' }}>
        <div className="ac-meeting-title" style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: '#b8d8f5',
          lineHeight: 1.45,
        }}>
          {title}
        </div>
      </div>

      {/* ── DATE + TIME GRID ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.3 }}
        style={{
          display: 'grid',
          gridTemplateColumns: dayNum ? '88px 1fr' : '1fr',
          gap: 10,
          margin: '12px 22px',
          alignItems: 'stretch',
        }}
      >
        {/* Calendar day block */}
        {dayNum && (
          <div style={{
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(0,111,191,0.2)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div className="ac-day-header" style={{
              padding: '6px 0',
              background: 'linear-gradient(135deg, #006FBF, #0056A0)',
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.7px',
              color: 'rgba(255,255,255,0.85)',
            }}>
              {dayShort}
            </div>
            <div className="ac-day-body" style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px 10px',
              background: 'rgba(0,111,191,0.08)',
            }}>
              <div className="ac-day-num" style={{ fontSize: 28, fontWeight: 900, color: '#e8f4ff', letterSpacing: '-1.5px', lineHeight: 1 }}>
                {dayNum}
              </div>
              <div className="ac-day-month" style={{ fontSize: 10.5, color: 'rgba(130,185,230,0.6)', marginTop: 3 }}>
                {monthShort}
              </div>
            </div>
          </div>
        )}

        {/* Time + date detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InfoRow
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z"/>
              </svg>
            }
            label="Time"
            value={time || 'TBC'}
          />
          {!dayNum && (
            <InfoRow
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 16H5V8h14v11z"/>
                </svg>
              }
              label="Date"
              value={date || 'TBC'}
            />
          )}
        </div>
      </motion.div>

      {/* ── ACTIONS ──────────────────────────────── */}
      <div style={{ padding: '4px 22px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.meetLink && (
          <motion.a
            href={data.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.3, ease: 'backOut' }}
            whileHover={{ scale: 1.015, boxShadow: '0 10px 30px rgba(0,111,191,0.5)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '13px 20px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #006FBF 0%, #0047ab 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              letterSpacing: '0.05px',
              boxShadow: '0 4px 20px rgba(0,111,191,0.35)',
              transition: 'box-shadow 0.2s ease',
            }}
          >
            <MeetIcon />
            Join Meeting
          </motion.a>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: <CalIconSm />, label: 'Add to Calendar' },
            { icon: <MailIconSm />, label: 'Email Reminder' },
          ].map(({ icon, label }) => (
            <motion.button
              key={label}
              className="ac-action-btn"
              whileHover={{ background: 'rgba(0,111,191,0.13)', borderColor: 'rgba(0,111,191,0.32)' }}
              whileTap={{ scale: 0.96 }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 8px',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(130,185,230,0.7)',
                border: '1px solid rgba(0,111,191,0.15)',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
            >
              {icon}&nbsp;{label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────── */}
      <div className="ac-footer" style={{
        padding: '10px 22px 14px',
        borderTop: '1px solid rgba(0,111,191,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: 'rgba(80,130,180,0.45)',
      }}>
        <span>🔒&nbsp;Linde Gas · Confidential</span>
        <span>Google Calendar</span>
      </div>
    </motion.div>
  );
}
