'use client';
import { motion } from 'framer-motion';
import type { MetricData } from '@/lib/dashboardData';

interface MetricCardsProps {
  data: MetricData;
}

function TrendArrow({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span className={`metric-delta ${up ? 'metric-delta-up' : 'metric-delta-down'}`}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {up
          ? <path d="M7 17l10-10M7 7h10v10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M17 7L7 17M17 17H7V7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
      </svg>
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

const CARDS = [
  {
    key: 'totalDownloads' as const,
    deltaKey: 'downloadsDelta' as const,
    label: 'Documents Downloaded',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M12 12v6M9 15l3 3 3-3"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
    ),
    accent: '#3b82f6',
  },
  {
    key: 'totalOrders' as const,
    deltaKey: 'ordersDelta' as const,
    label: 'Orders Processed',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="6" width="15" height="11" rx="2"/>
        <path d="M16 10h4l3 4v3h-7V10z"/>
        <circle cx="5.5" cy="18.5" r="1.5"/>
        <circle cx="18.5" cy="18.5" r="1.5"/>
      </svg>
    ),
    accent: '#10b981',
  },
  {
    key: 'totalConversations' as const,
    deltaKey: 'conversationsDelta' as const,
    label: 'Total Conversations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    accent: '#8b5cf6',
  },
  {
    key: 'activeSessions' as const,
    deltaKey: 'sessionsDelta' as const,
    label: 'Active Sessions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
      </svg>
    ),
    accent: '#f59e0b',
  },
];

export default function MetricCards({ data }: MetricCardsProps) {
  return (
    <div className="metric-cards-grid">
      {CARDS.map(({ key, deltaKey, label, icon, accent }, i) => (
        <motion.div
          key={key}
          className="metric-card"
          style={{ '--mc-accent': accent } as React.CSSProperties}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mc-top">
            <div className="mc-icon-wrap" style={{ background: `${accent}1a`, color: accent }}>
              {icon}
            </div>
            <TrendArrow delta={data[deltaKey]} />
          </div>
          <div className="mc-value">
            {data[key].toLocaleString()}
          </div>
          <div className="mc-label">{label}</div>
          <div className="mc-bar-track">
            <motion.div
              className="mc-bar-fill"
              style={{ background: `linear-gradient(90deg, ${accent}cc, ${accent}55)` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (data[key] / 2000) * 100)}%` }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.9, ease: [0.34, 1.1, 0.64, 1] }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
