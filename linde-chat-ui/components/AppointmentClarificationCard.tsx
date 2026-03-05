'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { AppointmentClarificationData } from '@/lib/types';

interface Props {
  data: AppointmentClarificationData;
  onSend: (text: string) => void;
}

const DURATION_OPTIONS = [
  { label: '15m',  value: '15' },
  { label: '30m',  value: '30' },
  { label: '45m',  value: '45' },
  { label: '60m',  value: '60' },
  { label: '90m',  value: '90' },
];

/* ─── Icons ─────────────────────────────────────────────── */
function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.12-.56-2.32-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
    </svg>
  );
}

function EmailFieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.55 }}>
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

function CalFieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.55 }}>
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 16H5V8h14v11z"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.55 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z"/>
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.55 }}>
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
    </svg>
  );
}

/* ─── Styled input wrapper ───────────────────────────────── */
function Field({
  icon, label, required, hasError, children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  hasError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label className="acc-field-label" style={{
        fontSize: 10.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.75px',
        color: hasError ? '#f87171' : 'rgba(100,160,220,0.65)',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        userSelect: 'none',
      }}>
        {icon}
        {label}
        {required && <span style={{ color: '#f87171', fontSize: 11 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── Base input styles (applied via CSS class) ────────── */
const BASE: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,111,191,0.18)',
  borderRadius: 10,
  color: '#c8dff5',
  fontSize: 13.5,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  colorScheme: 'dark',
  transition: 'border-color 0.15s ease, background 0.15s ease',
};

const ERR: React.CSSProperties = {
  ...BASE,
  borderColor: 'rgba(248,113,113,0.45)',
  background: 'rgba(248,113,113,0.05)',
};

export default function AppointmentClarificationCard({ data, onSend }: Props) {
  const { missing_fields = [], prefill = {} } = data;
  const isMissing = (f: string) => missing_fields.includes(f);

  const [email,    setEmail]    = useState('');
  const [date,     setDate]     = useState('');
  const [time,     setTime]     = useState('');
  const [subject,  setSubject]  = useState(String(prefill.subject || ''));
  const [duration, setDuration] = useState(String(prefill.duration_min || 30));
  const [focused,  setFocused]  = useState<string | null>(null);

  const canSubmit =
    (!isMissing('email') || email.trim()) &&
    (!isMissing('date')  || date.trim())  &&
    (!isMissing('time')  || time.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = ['Schedule a call.'];
    if (email.trim())   parts.push(`Email: ${email.trim()}`);
    if (date.trim())    parts.push(`Date: ${date.trim()}`);
    if (time.trim())    parts.push(`Time: ${time.trim()} CET`);
    if (subject.trim()) parts.push(`Subject: ${subject.trim()}`);
    parts.push(`Duration: ${duration}min`);
    onSend(parts.join(', '));
  };

  const inputStyle  = (field: string): React.CSSProperties => ({
    ...(isMissing(field) && !eval(`${field}`.replace('email','email').replace('date','date').replace('time','time')) && false ? ERR : BASE),
    borderColor: focused === field
      ? '#006FBF'
      : (isMissing(field) && !(field === 'email' ? email : field === 'date' ? date : time))
        ? 'rgba(248,113,113,0.45)'
        : 'rgba(0,111,191,0.18)',
    background: focused === field
      ? 'rgba(0,111,191,0.08)'
      : (isMissing(field) && !(field === 'email' ? email : field === 'date' ? date : time))
        ? 'rgba(248,113,113,0.05)'
        : BASE.background,
    boxShadow: focused === field ? '0 0 0 3px rgba(0,111,191,0.15)' : 'none',
  });

  return (
    <motion.div
      className="acc-root"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        marginTop: 12,
        maxWidth: 420,
        borderRadius: 18,
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #080f1e 0%, #0b1a30 60%, #070d1b 100%)',
        border: '1px solid rgba(0,122,200,0.2)',
        boxShadow: '0 0 0 1px rgba(0,122,200,0.07), 0 24px 48px rgba(0,0,0,0.55)',
        fontFamily: 'inherit',
      }}
    >
      {/* Top bar */}
      <div className="acc-accent-bar" style={{
        height: 3,
        background: 'linear-gradient(90deg, #006FBF, #00c6a7, #006FBF)',
        backgroundSize: '200% 100%',
        animation: 'gradientShift 3.5s ease infinite',
      }} />

      {/* ── HEADER ───────────────────────────────── */}
      <div className="acc-header" style={{
        padding: '18px 20px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderBottom: '1px solid rgba(0,111,191,0.1)',
      }}>
        <div className="acc-header-icon" style={{
          width: 42, height: 42,
          borderRadius: 12,
          background: 'linear-gradient(145deg, rgba(0,111,191,0.3), rgba(0,80,150,0.2))',
          border: '1px solid rgba(0,111,191,0.3)',
          display: 'grid',
          placeItems: 'center',
          color: '#7ab8e8',
          flexShrink: 0,
        }}>
          <PhoneIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div className="acc-title" style={{
            fontSize: 15.5,
            fontWeight: 800,
            color: '#e0f0ff',
            letterSpacing: '-0.25px',
            lineHeight: 1.2,
          }}>
            Book a Sales Call
          </div>
          <div className="acc-subtitle" style={{
            fontSize: 12,
            color: 'rgba(120,175,225,0.55)',
            marginTop: 3,
          }}>
            Connect with a Linde Gas representative
          </div>
        </div>
        {/* Required badge */}
        {missing_fields.length > 0 && (
          <div className="acc-required-badge" style={{
            padding: '3px 9px',
            borderRadius: 20,
            background: 'rgba(248,113,113,0.12)',
            border: '1px solid rgba(248,113,113,0.25)',
            fontSize: 10.5,
            fontWeight: 700,
            color: '#f87171',
            whiteSpace: 'nowrap',
          }}>
            {missing_fields.length} required
          </div>
        )}
      </div>

      {/* ── FORM ─────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ padding: '16px 20px 20px' }}>

        {/* Email */}
        <div style={{ marginBottom: 13 }}>
          <Field icon={<EmailFieldIcon />} label="Email Address" required={isMissing('email')} hasError={isMissing('email') && !email}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder="you@company.com"
              style={inputStyle('email')}
            />
          </Field>
        </div>

        {/* Date + Time row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 13 }}>
          <Field icon={<CalFieldIcon />} label="Date" required={isMissing('date')} hasError={isMissing('date') && !date}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              onFocus={() => setFocused('date')}
              onBlur={() => setFocused(null)}
              style={inputStyle('date')}
            />
          </Field>
          <Field icon={<ClockIcon />} label="Time (CET)" required={isMissing('time')} hasError={isMissing('time') && !time}>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              onFocus={() => setFocused('time')}
              onBlur={() => setFocused(null)}
              style={inputStyle('time')}
            />
          </Field>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 13 }}>
          <Field icon={<NoteIcon />} label="Subject / Agenda">
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              onFocus={() => setFocused('subject')}
              onBlur={() => setFocused(null)}
              placeholder="e.g. Oxygen supply consultation"
              style={{
                ...BASE,
                borderColor: focused === 'subject' ? '#006FBF' : 'rgba(0,111,191,0.18)',
                background: focused === 'subject' ? 'rgba(0,111,191,0.08)' : BASE.background,
                boxShadow: focused === 'subject' ? '0 0 0 3px rgba(0,111,191,0.15)' : 'none',
              }}
            />
          </Field>
        </div>

        {/* Duration pills */}
        <div style={{ marginBottom: 20 }}>
          <label className="acc-field-label" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.75px',
            color: 'rgba(100,160,220,0.65)',
            marginBottom: 8,
            userSelect: 'none',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.55 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z"/>
            </svg>
            Duration
          </label>
          <div style={{ display: 'flex', gap: 7 }}>
            {DURATION_OPTIONS.map(opt => {
              const active = duration === opt.value;
              return (
                <motion.button
                  className={`acc-duration-pill${active ? ' acc-duration-active' : ''}`}
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 9,
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    border: active
                      ? '1.5px solid rgba(0,111,191,0.6)'
                      : '1px solid rgba(0,111,191,0.14)',
                    background: active
                      ? 'linear-gradient(145deg, rgba(0,111,191,0.28), rgba(0,80,160,0.18))'
                      : 'rgba(255,255,255,0.03)',
                    color: active ? '#7bc8f8' : 'rgba(120,175,220,0.5)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 0 14px rgba(0,111,191,0.2)' : 'none',
                  }}
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <motion.button
          className="acc-submit-btn"
          type="submit"
          disabled={!canSubmit}
          animate={canSubmit
            ? { boxShadow: ['0 4px 20px rgba(0,111,191,0.25)', '0 4px 28px rgba(0,111,191,0.45)', '0 4px 20px rgba(0,111,191,0.25)'] }
            : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={canSubmit ? { scale: 1.015 } : {}}
          whileTap={canSubmit ? { scale: 0.972 } : {}}
          style={{
            width: '100%',
            padding: '13px 20px',
            borderRadius: 12,
            border: 'none',
            background: canSubmit
              ? 'linear-gradient(135deg, #006FBF 0%, #0056A0 100%)'
              : 'rgba(255,255,255,0.05)',
            color: canSubmit ? '#fff' : 'rgba(120,160,200,0.4)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.15px',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            transition: 'background 0.2s ease, color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {canSubmit ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
              Confirm &amp; Schedule Call
            </>
          ) : (
            'Complete required fields above'
          )}
        </motion.button>

        {/* Footer note */}
        <div className="acc-footer" style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 11,
          color: 'rgba(80,130,180,0.45)',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Linde Gas · Google Meet · Calendar invite to your email
        </div>
      </form>
    </motion.div>
  );
}
