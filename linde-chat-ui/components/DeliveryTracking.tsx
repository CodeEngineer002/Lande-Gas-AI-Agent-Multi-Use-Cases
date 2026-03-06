'use client';
import { motion } from 'framer-motion';
import type { DeliveryData } from '@/lib/types';
import { useDateFormatter } from '@/lib/settingsContext';

/* ── Status resolution ────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { progress: number; step: number; color: string; glow: string; label: string }> = {
  Confirmed:          { progress: 20,  step: 1, color: '#3b82f6', glow: 'rgba(59,130,246,0.45)',  label: 'Confirmed'          },
  Packed:             { progress: 40,  step: 2, color: '#8b5cf6', glow: 'rgba(139,92,246,0.45)',  label: 'Packed'             },
  'In Transit':       { progress: 65,  step: 3, color: '#f59e0b', glow: 'rgba(245,158,11,0.45)',  label: 'In Transit'         },
  'Out for Delivery': { progress: 85,  step: 4, color: '#06b6d4', glow: 'rgba(6,182,212,0.45)',   label: 'Out for Delivery'   },
  Delivered:          { progress: 100, step: 5, color: '#10b981', glow: 'rgba(16,185,129,0.45)',  label: 'Delivered'          },
  Delayed:            { progress: 65,  step: 3, color: '#ef4444', glow: 'rgba(239,68,68,0.45)',   label: 'Delayed'            },
  'On Hold':          { progress: 40,  step: 2, color: '#f97316', glow: 'rgba(249,115,22,0.45)',  label: 'On Hold'            },
  Cancelled:          { progress: 0,   step: 0, color: '#6b7280', glow: 'rgba(107,114,128,0.3)',  label: 'Cancelled'          },
};

function resolveStatus(status: string) {
  const s = status.toLowerCase();
  if (s.includes('cancel'))                         return STATUS_MAP.Cancelled;
  if (s.includes('hold'))                           return STATUS_MAP['On Hold'];
  if (s.includes('delay'))                          return STATUS_MAP.Delayed;
  if (s.includes('deliver') && !s.includes('out'))  return STATUS_MAP.Delivered;
  if (s.includes('out'))                            return STATUS_MAP['Out for Delivery'];
  if (s.includes('transit'))                        return STATUS_MAP['In Transit'];
  if (s.includes('pack'))                           return STATUS_MAP.Packed;
  if (s.includes('confirm'))                        return STATUS_MAP.Confirmed;
  return STATUS_MAP['In Transit'];
}

/* ── Step definitions ─────────────────────────────────────────────── */
const STEPS = [
  {
    label: 'Confirmed', minStep: 1,
    icon: (filled: boolean) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 12l2 2 4-4" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="9" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2"/>
      </svg>
    ),
  },
  {
    label: 'Packed', minStep: 2,
    icon: (filled: boolean) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2"/>
        <path d="M12 12v5M9.5 12h5" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'In Transit', minStep: 3,
    icon: (filled: boolean) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="6" width="15" height="11" rx="2" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2"/>
        <path d="M16 10h4l3 4v3h-7V10z" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="5.5" cy="18.5" r="1.5" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2"/>
        <circle cx="18.5" cy="18.5" r="1.5" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2"/>
      </svg>
    ),
  },
  {
    label: 'Out for Delivery', minStep: 4,
    icon: (filled: boolean) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2"/>
        <circle cx="12" cy="9" r="2.5" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2"/>
      </svg>
    ),
  },
  {
    label: 'Delivered', minStep: 5,
    icon: (filled: boolean) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <polyline points="20,6 9,17 4,12" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

/* ── Info tile ───────────────────────────────────────────────────── */
function InfoTile({ label, value, icon, delay }: { label: string; value: string; icon: React.ReactNode; delay: number }) {
  if (!value) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className="dc-info-tile"
    >
      <span className="dc-info-icon">{icon}</span>
      <div>
        <div className="dc-info-label">{label}</div>
        <div className="dc-info-value">{value}</div>
      </div>
    </motion.div>
  );
}

/* ── SVG icons for info tiles ────────────────────────────────────── */
const TruckIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="15" height="11" rx="2"/><path d="M16 10h4l3 4v3h-7V10z"/><circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/></svg>;
const UserIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const TagIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const PinIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const CalIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const CheckCirIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
const FlaskIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3h6M12 3v6l-5 9h12L14 9V3"/></svg>;

/* ── Main component ───────────────────────────────────────────────── */
interface DeliveryTrackingProps {
  data: DeliveryData;
}

export default function DeliveryTracking({ data }: DeliveryTrackingProps) {
  const formatDate = useDateFormatter();
  const cfg      = resolveStatus(data.current_status);
  const isMoving = cfg.step === 3 || cfg.step === 4;
  const isProb   = cfg.step === 0
    || data.current_status.toLowerCase().includes('delay')
    || data.current_status.toLowerCase().includes('hold');

  return (
    <motion.div
      className="delivery-card"
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Card Header ── */}
      <div className="dc-header">
        <div className="dc-header-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.2">
            <rect x="1" y="6" width="15" height="11" rx="2"/>
            <path d="M16 10h4l3 4v3h-7V10z"/>
            <circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/>
          </svg>
          <span>Order Tracking</span>
        </div>
        <div className="dc-header-right">
          {data.order_id && (
            <span className="dc-order-chip">{data.order_id}</span>
          )}
          <span className="dc-status-chip" style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
            {isMoving && <span className="dc-pulse-dot" style={{ background: cfg.color }} />}
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Status detail banner ── */}
      {data.status_detail && (
        <motion.div
          className="dc-detail-banner"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {data.status_detail}
        </motion.div>
      )}

      {/* ── Progress track ── */}
      <div className="dc-progress-wrap">
        <div className="dc-track">
          {(() => {
            const stepPct = (cfg.step - 1) / (STEPS.length - 1) * 100;
            // isMoving statuses (In Transit / Out for Delivery): bar matches truck position
            // All other statuses: use cfg.progress for correct visual fill
            const barPct = isMoving ? stepPct : cfg.progress;
            return (<>
              <motion.div
                className="dc-fill"
                style={{ '--fill-color': cfg.color, '--fill-glow': cfg.glow } as React.CSSProperties}
                initial={{ width: '0%' }}
                animate={{ width: `${barPct}%` }}
                transition={{ duration: 1.4, ease: [0.34, 1.26, 0.64, 1], delay: 0.3 }}
              />
              {isMoving && (
                <motion.div
                  className="dc-truck"
                  initial={{ left: '0%' }}
                  animate={{ left: `calc(${stepPct}% - 18px)` }}
                  transition={{ duration: 1.4, ease: [0.34, 1.26, 0.64, 1], delay: 0.3 }}
                >
                  <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>🚚</span>
                </motion.div>
              )}
            </>);
          })()}
        </div>

        {/* Step nodes */}
        <div className="dc-steps">
          {STEPS.map(({ label, minStep, icon }, i) => {
            const done    = cfg.step > minStep;
            const active  = cfg.step === minStep;
            const filled  = done || active;
            const delayed = isProb && filled;
            const nodeColor  = delayed ? '#ef4444' : filled ? cfg.color : 'transparent';
            const glowColor  = delayed ? 'rgba(239,68,68,0.45)' : filled ? cfg.glow : 'none';
            const labelColor = delayed ? '#ef4444' : filled ? cfg.color : 'rgba(255,255,255,0.28)';

            return (
              <motion.div
                key={label}
                className="dc-step"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.3, ease: 'backOut' }}
              >
                {active && !delayed && (
                  <span className="dc-step-ring" style={{ '--ring-color': cfg.color } as React.CSSProperties} />
                )}
                <div
                  className="dc-step-node"
                  style={{
                    background: filled
                      ? `linear-gradient(135deg, ${nodeColor}cc, ${nodeColor})`
                      : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${filled ? nodeColor : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: filled
                      ? `0 0 14px ${glowColor}, 0 3px 8px rgba(0,0,0,0.3)`
                      : 'none',
                    color: filled ? '#fff' : 'rgba(255,255,255,0.22)',
                  }}
                >
                  {icon(filled)}
                </div>
                <span className="dc-step-label" style={{ color: labelColor, fontWeight: filled ? 700 : 400 }}>
                  {label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="dc-info-grid">
        <InfoTile label="Carrier"       value={data.carrier          || ''} icon={<TruckIcon />}    delay={0.40} />
        <InfoTile label="Tracking #"    value={data.tracking_number  || ''} icon={<TagIcon />}      delay={0.46} />
        <InfoTile label="Customer"      value={data.customer_name    || ''} icon={<UserIcon />}     delay={0.52} />
        <InfoTile label="Destination"   value={[data.ship_to_city, data.country].filter(Boolean).join(', ')} icon={<PinIcon />} delay={0.58} />
        <InfoTile label="Product"       value={data.product          || ''} icon={<FlaskIcon />}    delay={0.64} />
        <InfoTile label="Order Date"    value={formatDate(data.order_date)}  icon={<CalIcon />}      delay={0.70} />
        {data.delivered_date
          ? <InfoTile label="Delivered"  value={formatDate(data.delivered_date)} icon={<CheckCirIcon />} delay={0.76} />
          : <InfoTile label="ETA"        value={formatDate(data.eta)}           icon={<CalIcon />}      delay={0.76} />}
        {data.received_by && (
          <InfoTile label="Received By" value={data.received_by} icon={<CheckCirIcon />} delay={0.82} />
        )}
      </div>
    </motion.div>
  );
}
