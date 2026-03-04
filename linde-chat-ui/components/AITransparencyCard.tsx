'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResponseMeta } from '@/lib/types';

interface Props {
  meta: ResponseMeta | null;
  hasResponded: boolean;  // true once at least one assistant reply exists
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? '#10b981' :
    pct >= 50 ? '#f59e0b' :
                '#ef4444';

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 6,
      }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Confidence</span>
        <motion.span
          key={pct}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 20, fontWeight: 800, color }}
        >
          {pct}%
        </motion.span>
      </div>
      <div style={{
        height: 7, borderRadius: 99,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 3,
      padding: '12px 10px',
      borderRadius: 12,
      background: 'rgba(0,111,191,0.07)',
      border: '1px solid rgba(0,111,191,0.14)',
      flex: 1,
    }}>
      <motion.span
        key={String(value)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand-2)', lineHeight: 1 }}
      >
        {value}
      </motion.span>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textAlign: 'center' }}>
        {label}
      </span>
    </div>
  );
}

export default function AITransparencyCard({ meta, hasResponded }: Props) {
  const showUnavailable = hasResponded && !meta;
  const showIdle = !hasResponded;

  return (
    <div style={{
      borderRadius: 14,
      background: 'rgba(0,111,191,0.05)',
      border: '1px solid rgba(0,111,191,0.15)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--brand-2), var(--brand))',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A8 8 0 0 1 4.07 9H5a1 1 0 0 1 0 2 6 6 0 0 0 6 6zm-1-6a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-4.93V6a1 1 0 0 1-2 0v-.07A8 8 0 0 1 19.93 13H19a1 1 0 0 1 0-2 6 6 0 0 0-6-6z"/>
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
          AI Transparency
        </span>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {showIdle && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '10px 0' }}
          >
            Awaiting first response…
          </motion.div>
        )}

        {showUnavailable && (
          <motion.div
            key="unavailable"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              fontSize: 12, color: 'var(--muted)', textAlign: 'center',
              padding: '8px', borderRadius: 8,
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            Unavailable
          </motion.div>
        )}

        {meta && (
          <motion.div
            key="data"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Confidence bar */}
            {meta.confidence !== null ? (
              <ConfidenceBar value={meta.confidence} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Confidence</span>
                <span style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>—</span>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 8 }}>
              <StatPill label="Sources Used" value={meta.sources_used} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
