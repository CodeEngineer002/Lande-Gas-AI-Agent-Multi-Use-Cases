'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { DownloadHistoryEntry, Source, DownloadPayload } from '@/lib/types';

const USER_NAME = 'John Doe';
const USER_INITIALS = 'JG';
const USER_ROLE = 'Administrator';

interface LeftSidebarEnterpriseProps {
  open?: boolean;
  downloadHistory: DownloadHistoryEntry[];
  onClearChat: () => void;
  onDownloadLast: () => void;
  lastSources: Source[];
  onDownload: (payload: DownloadPayload) => void;
}

/* ─── Icon Helpers ─────────────────────────────────────────── */
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17,8 12,3 7,8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ef4444' }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 1.5L18.5 8H14V3.5zM9.5 14.5h-1v-4h1c1.1 0 1.5.5 1.5 1.5v1c0 1-.4 1.5-1.5 1.5zm0-3.5h-.3v3h.3c.6 0 .7-.3.7-1v-1c0-.7-.1-1-.7-1zM12 14.5v-4h1.75c.75 0 1.25.4 1.25 1.25v.25c0 .55-.3.9-.8 1 .6.1.8.45.8 1v.5h-.75v-.55c0-.55-.2-.7-.6-.7H12.7v1.25H12zm.7-3.5v1.15h.85c.35 0 .45-.2.45-.6s-.1-.55-.45-.55H12.7zm4.05 3.5v-4h2v.7h-1.25v1h1.15v.7h-1.15v1h1.25v.7H16.75z"/>
    </svg>
  );
}

function DocxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#3b82f6' }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 1.5L18.5 8H14V3.5zM8 17l1.5-5 1.5 3.5 1-2.5 1.5 4H8z"/>
    </svg>
  );
}

function GenericDocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5z"/>
    </svg>
  );
}

function getDocIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.endsWith('.pdf') || lower.includes('pdf')) return <PdfIcon />;
  if (lower.endsWith('.docx') || lower.endsWith('.doc') || lower.includes('docx')) return <DocxIcon />;
  return <GenericDocIcon />;
}

function formatDateTime(timeStr: string) {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    const date = d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
  } catch {
    return timeStr;
  }
}

const NAV_ITEMS = [
  { icon: <HomeIcon />, label: 'Home', active: false },
  { icon: <ChatIcon />, label: 'Chat', active: true },
  { icon: <DocsIcon />, label: 'Documents', active: false },
  { icon: <SettingsIcon />, label: 'Settings', active: false },
] as const;

export default function LeftSidebarEnterprise({
  open = true,
  downloadHistory,
  onClearChat,
  onDownloadLast,
  lastSources,
}: LeftSidebarEnterpriseProps) {
  const canDownload = lastSources.length > 0;

  return (
    <div className="sidebar-enterprise-wrap">
      {/* ── Icon Rail (thin left strip) ── */}
      <nav className="icon-rail">
        {NAV_ITEMS.map(({ icon, label, active }) => (
          <motion.button
            key={label}
            className={`rail-btn${active ? ' active' : ''}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={label}
          >
            {icon}
          </motion.button>
        ))}
      </nav>

      {/* ── Main Sidebar Panel ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            key="sidebar-panel"
            className="sidebar-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 307, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* ── User Chip ── */}
            <motion.div
              className="sidebar-user-chip"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.3 }}
            >
              <div className="sidebar-avatar">{USER_INITIALS}</div>
              <div>
                <div className="sidebar-username">{USER_NAME}</div>
                <div className="sidebar-userrole">{USER_ROLE}</div>
              </div>
              <div className="sidebar-user-status">
                <span className="status-dot" />
              </div>
            </motion.div>

            {/* ── Agent Insights ── */}
            <motion.div
              className="sidebar-section"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.3 }}
            >
              <div className="sidebar-section-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--brand)' }}>
                  <path d="M5 19h-2v-7h2v7zm4 0H7v-11h2v11zm4 0h-2v-5h2v5zm4 0h-2v-9h2v9zm4 0h-2v-3h2v3z"/>
                </svg>
                Agent Insights
              </div>
              <div className="agent-insights-grid">
                <div className="insight-metric">
                  <span className="insight-value">1.2K</span>
                  <span className="insight-label">Active Sessions</span>
                </div>
                <div className="insight-metric">
                  <span className="insight-value">1.4s</span>
                  <span className="insight-label">Avg Response</span>
                </div>
                <div className="insight-metric">
                  <span className="insight-value">98.2%</span>
                  <span className="insight-label">Query Accuracy</span>
                </div>
              </div>
            </motion.div>

            {/* ── Quick Actions ── */}
            <motion.div
              className="sidebar-section"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.3 }}
            >
              <div className="sidebar-section-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--brand)' }}>
                  <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z"/>
                </svg>
                Quick Actions
              </div>
              <div className="quick-actions-grid">
                <motion.button
                  className="qa-btn"
                  onClick={onClearChat}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -1 }}
                  title="Start a new conversation"
                >
                  <span className="qa-icon qa-icon-blue"><PlusIcon /></span>
                  <span className="qa-label">New Chat</span>
                </motion.button>

                <motion.button
                  className="qa-btn qa-btn-disabled"
                  whileTap={{ scale: 0.95 }}
                  title="Upload Document — Coming soon"
                  disabled
                >
                  <span className="qa-icon qa-icon-purple"><UploadIcon /></span>
                  <span className="qa-label">Upload Doc</span>
                </motion.button>

                <motion.button
                  className={`qa-btn${!canDownload ? ' qa-btn-disabled' : ''}`}
                  onClick={onDownloadLast}
                  disabled={!canDownload}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: !canDownload ? 0 : -1 }}
                  title={canDownload ? 'Download last document' : 'No documents available yet'}
                >
                  <span className="qa-icon qa-icon-green"><DatabaseIcon /></span>
                  <span className="qa-label">Knowledge Base</span>
                </motion.button>
              </div>
            </motion.div>

            {/* ── Document History ── */}
            <motion.div
              className="sidebar-section sidebar-section-flex"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.3 }}
            >
              <div className="sidebar-section-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--brand)' }}>
                  <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5z"/>
                </svg>
                Document History
                {downloadHistory.length > 0 && (
                  <span className="sidebar-badge">{downloadHistory.length}</span>
                )}
              </div>
              <div className="doc-history-list">
                {downloadHistory.length === 0 ? (
                  <div className="sidebar-empty">No downloads yet.</div>
                ) : (
                  downloadHistory.map((h, i) => (
                    <motion.div
                      key={`${h.doc_id}-${i}`}
                      className="doc-history-item"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <span className="doc-history-icon">
                        {getDocIcon(h.title)}
                      </span>
                      <div className="doc-history-info">
                        <span className="doc-history-title" title={h.title}>{h.title}</span>
                        <span className="doc-history-meta">{formatDateTime(h.time)}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
