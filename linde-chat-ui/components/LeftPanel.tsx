'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { DownloadHistoryEntry, Source, DownloadPayload } from '@/lib/types';

interface LeftPanelProps {
  open?: boolean;
  downloadHistory: DownloadHistoryEntry[];
  onClearChat: () => void;
  onDownloadLast: () => void;
  lastSources: Source[];
  onDownload: (payload: DownloadPayload) => void;
}

function DocIcon() {
  return (
    <svg style={{ width: 13, height: 13, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L11 13.17V3h1zM5 18h14v2H5z"/>
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 19h-2v-7h2v7zm4 0H7v-11h2v11zm4 0h-2v-5h2v5zm4 0h-2v-9h2v9zm4 0h-2v-3h2v3z"/>
    </svg>
  );
}

interface PanelCardProps {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  delay?: number;
}

function PanelCard({ children, title, icon, delay = 0 }: PanelCardProps) {
  return (
    <motion.div
      className="panel-card glass"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="panel-card-header" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{
          width: 22, height: 22,
          borderRadius: 7,
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, rgba(0,111,191,0.15), rgba(0,181,226,0.15))',
          color: 'var(--brand)',
          border: '1px solid rgba(0,111,191,0.18)',
        }}>
          {icon}
        </span>
        {title}
      </div>
      <div style={{ padding: '10px 12px' }}>
        {children}
      </div>
    </motion.div>
  );
}

const QUICK_ACTIONS = [
  { label: 'Clear conversation', action: 'clear', icon: <TrashIcon />, color: '#ef4444' },
  { label: 'Download last PDF', action: 'download', icon: <DownloadIcon />, color: 'var(--brand)' },
] as const;

export default function LeftPanel({
  open = true,
  downloadHistory,
  onClearChat,
  onDownloadLast,
  lastSources,
}: LeftPanelProps) {

  const handlers: Record<string, () => void> = {
    clear: onClearChat,
    download: onDownloadLast,
  };

  const disabled: Record<string, boolean> = {
    clear: false,
    download: lastSources.length === 0,
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0, x: -20 }}
          animate={{ width: '100%', opacity: 1, x: 0 }}
          exit={{ width: 0, opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {/* inner wrapper fills container width */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
      <PanelCard title="Quick Actions" icon={<LightningIcon />} delay={0.05}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {QUICK_ACTIONS.map(({ label, action, icon }) => (
            <motion.button
              key={action}
              className="quick-action-btn"
              onClick={handlers[action]}
              disabled={disabled[action]}
              whileTap={{ scale: 0.96 }}
              style={{ opacity: disabled[action] ? 0.4 : 1, cursor: disabled[action] ? 'not-allowed' : 'pointer' }}
            >
              <span className="icon-dot" />
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {icon}
                {label}
              </span>
            </motion.button>
          ))}
        </div>
      </PanelCard>

      {/* Download History */}
      <PanelCard title="Document History" icon={<DocIcon />} delay={0.12}>
        <div style={{
          maxHeight: 210,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          {downloadHistory.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic', padding: '4px 0' }}>
              No downloads yet.
            </div>
          ) : (
            downloadHistory.map((h, i) => (
              <motion.div
                key={`${h.doc_id}-${i}`}
                className="dl-history-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.22 }}
              >
                <span style={{
                  width: 24, height: 24,
                  borderRadius: 7,
                  background: 'linear-gradient(135deg, rgba(0,111,191,0.12), rgba(0,181,226,0.12))',
                  border: '1px solid rgba(0,111,191,0.18)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--brand)',
                  flexShrink: 0,
                }}>
                  <DocIcon />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.title}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{h.doc_id}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </PanelCard>

      {/* Insights */}
      <PanelCard title="Agent Insights" icon={<ChartIcon />} delay={0.2}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="stat-chip">
            <span className="stat-value">{downloadHistory.length}</span>
            <span className="stat-label">Downloads</span>
          </div>
          <div className="stat-chip">
            <span className="stat-value">7</span>
            <span className="stat-label">Intents</span>
          </div>
          <div className="stat-chip">
            <span className="stat-value">∞</span>
            <span className="stat-label">Queries</span>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, borderTop: '1px solid var(--assistBorder)', paddingTop: 8 }}>
          Supports datasheets, quotes, delivery tracking, appointments and availability checks.
        </div>
      </PanelCard>

          </div>{/* end inner wrapper */}
    </motion.aside>
      )}
    </AnimatePresence>
  );
}
