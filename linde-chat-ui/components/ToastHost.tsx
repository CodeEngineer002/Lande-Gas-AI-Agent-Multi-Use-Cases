'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Toast as ToastType } from '@/lib/types';

interface ToastHostProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

const ICONS = {
  info:    '💬',
  success: '✅',
  error:   '⚠️',
};

const PALETTES = {
  info:    { bg: 'rgba(235,247,255,0.97)', border: '#bcdff7', accent: '#006fbf', barBg: '#006fbf' },
  success: { bg: 'rgba(236,253,245,0.97)', border: '#6ee7b7', accent: '#059669', barBg: '#10b981' },
  error:   { bg: 'rgba(255,241,241,0.97)', border: '#fca5a5', accent: '#dc2626', barBg: '#ef4444' },
};

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: (id: string) => void }) {
  const p = PALETTES[toast.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      onClick={() => onDismiss(toast.id)}
      style={{
        minWidth: 260,
        maxWidth: 380,
        padding: '12px 14px 12px 12px',
        borderRadius: 14,
        border: `1.5px solid ${p.border}`,
        background: p.bg,
        backdropFilter: 'blur(16px)',
        boxShadow: `0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Left color accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: 4,
        background: p.barBg,
        borderRadius: '14px 0 0 14px',
      }} />

      {/* Icon */}
      <div style={{
        width: 28, height: 28,
        borderRadius: 9,
        display: 'grid',
        placeItems: 'center',
        background: `${p.accent}18`,
        border: `1.5px solid ${p.accent}30`,
        fontSize: 14,
        flexShrink: 0,
        marginLeft: 6,
      }}>
        {ICONS[toast.type]}
      </div>

      {/* Text */}
      <span style={{
        flex: 1,
        fontSize: 13.5,
        fontWeight: 500,
        color: '#1e293b',
        lineHeight: 1.5,
        paddingTop: 1,
      }}>
        {toast.text}
      </span>

      {/* Close hint */}
      <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, flexShrink: 0 }}>✕</span>
    </motion.div>
  );
}

export default function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 24,
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: toasts.length ? 'auto' : 'none',
        alignItems: 'flex-end',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
