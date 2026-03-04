'use client';
import { motion } from 'framer-motion';
import type { DeliveryData } from '@/lib/types';

interface DeliveryTrackingProps {
  data: DeliveryData;
}

const STATUS_CONFIG: Record<string, { progress: number; step: number; badgeClass: string }> = {
  Confirmed:          { progress: 20,  step: 1, badgeClass: 'badge-confirmed' },
  Packed:             { progress: 40,  step: 2, badgeClass: 'badge-packed' },
  'In Transit':       { progress: 65,  step: 3, badgeClass: 'badge-in-transit' },
  'Out for Delivery': { progress: 85,  step: 4, badgeClass: 'badge-out-for-delivery' },
  Delivered:          { progress: 100, step: 5, badgeClass: 'badge-delivered' },
  Delayed:            { progress: 65,  step: 3, badgeClass: 'badge-delayed' },
  'On Hold':          { progress: 40,  step: 2, badgeClass: 'badge-on-hold' },
  Cancelled:          { progress: 0,   step: 0, badgeClass: 'badge-cancelled' },
};

function resolveStatus(status: string) {
  const s = status.toLowerCase();
  if (s.includes('delay'))   return STATUS_CONFIG.Delayed;
  if (s.includes('hold'))    return STATUS_CONFIG['On Hold'];
  if (s.includes('cancel'))  return STATUS_CONFIG.Cancelled;
  if (s.includes('deliver') && !s.includes('out')) return STATUS_CONFIG.Delivered;
  if (s.includes('confirm')) return STATUS_CONFIG.Confirmed;
  if (s.includes('pack'))    return STATUS_CONFIG.Packed;
  if (s.includes('transit')) return STATUS_CONFIG['In Transit'];
  if (s.includes('out'))     return STATUS_CONFIG['Out for Delivery'];
  return STATUS_CONFIG['In Transit'];
}

const STEPS = [
  { icon: '📋', label: 'Confirmed',        minStep: 1 },
  { icon: '📦', label: 'Packed',           minStep: 2 },
  { icon: '🚚', label: 'In Transit',       minStep: 3 },
  { icon: '🚛', label: 'Out for Delivery', minStep: 4 },
  { icon: '✅', label: 'Delivered',        minStep: 5 },
];

export default function DeliveryTracking({ data }: DeliveryTrackingProps) {
  const config = resolveStatus(data.current_status);
  const isProblem   = ['badge-delayed', 'badge-on-hold', 'badge-cancelled'].includes(config.badgeClass);
  const isMoving    = config.step === 3 || config.step === 4;
  const isCancelled = config.badgeClass === 'badge-cancelled';

  const stepClass = (minStep: number): '' | 'active' | 'delayed' => {
    if (config.step >= minStep) return isProblem ? 'delayed' : 'active';
    return '';
  };

  const fillClass = isCancelled ? ' cancelled' : isProblem ? ' delayed' : '';

  return (
    <motion.div
      className="delivery-tracking"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 18 }}>📍</span> Order Tracking
        </span>
        {data.order_number && (
          <span style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--brand)',
            background: 'rgba(0,111,191,0.1)',
            border: '1px solid rgba(0,111,191,0.2)',
            padding: '4px 10px',
            borderRadius: 8,
          }}>
            {data.order_number}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'SHIPPED VIA', value: data.shipped_via || '—', emoji: '🏭' },
          { label: 'STATUS',      value: data.current_status || '—', emoji: '📊' },
          { label: 'EXPECTED',    value: data.expected_date || '—', emoji: '📅' },
        ].map(({ label, value, emoji }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.25 }}
            style={{
              textAlign: 'center',
              padding: '12px 8px',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 10,
              border: '1px solid rgba(0,111,191,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 4 }}>{emoji}</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {label}
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{value}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ position: 'relative', margin: '20px 0 28px' }}>
        <div className="progress-bar">
          <motion.div
            className={`progress-fill${fillClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${config.progress}%` }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
          />
          {isMoving && (
            <div style={{
              position: 'absolute',
              top: -12,
              left: `${config.progress - 2}%`,
              transition: 'left 1.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <span style={{ fontSize: 22, animation: 'truckMove 3s ease-in-out infinite', display: 'block' }}>
                🚚
              </span>
            </div>
          )}
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
          {STEPS.map(({ icon, label, minStep }, i) => {
            const cls = stepClass(minStep);
            const isActive = cls === 'active';
            const isDelayed = cls === 'delayed';
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.28, ease: 'backOut' }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
              >
                <div style={{
                  width: 34, height: 34,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  marginBottom: 6,
                  background: isActive ? 'linear-gradient(135deg, var(--brand-2), #10b981)'
                    : isDelayed ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'rgba(0,0,0,0.06)',
                  color: (isActive || isDelayed) ? 'white' : 'var(--muted)',
                  boxShadow: isActive ? '0 4px 12px rgba(16,185,129,0.35)'
                    : isDelayed ? '0 4px 12px rgba(245,158,11,0.35)'
                    : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {icon}
                </div>
                <span style={{
                  fontSize: 10.5,
                  textAlign: 'center',
                  color: isActive ? '#10b981' : isDelayed ? '#f59e0b' : 'var(--muted)',
                  fontWeight: (isActive || isDelayed) ? 700 : 500,
                  lineHeight: 1.3,
                }}>
                  {label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.28, ease: 'backOut' }}
        className={config.badgeClass}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12.5,
          fontWeight: 700,
        }}
      >
        {isMoving && (
          <span style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: 'currentColor',
            display: 'inline-block',
            animation: 'pingSlow 1.8s ease-in-out infinite',
          }} />
        )}
        Current Status: <strong>{data.current_status || '—'}</strong>
      </motion.div>
    </motion.div>
  );
}
