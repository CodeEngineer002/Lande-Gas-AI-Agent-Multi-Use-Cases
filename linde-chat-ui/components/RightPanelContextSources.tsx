'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResponseMeta, Source, DownloadPayload, ChatMessage } from '@/lib/types';
import { useSettings } from '@/lib/settingsContext';
import { copyToClipboard } from '@/lib/utils';

interface RightPanelContextSourcesProps {
  meta: ResponseMeta | null;
  hasResponded: boolean;
  lastSources: Source[];
  onDownload: (payload: DownloadPayload) => void;
  messages: ChatMessage[];
  onShowToast?: (type: 'info' | 'success' | 'error', text: string, duration?: number) => void;
  onFillPrompt?: (text: string) => void;
}

/* ─── Quick Prompts ─────────────────────────────────────────── */
const QUICK_PROMPTS = [
  {
    color: '#006fbf',
    category: 'Product Data',
    title: 'Oxygen Datasheet',
    description: 'Retrieve the full product data sheet for Oxygen gas.',
    text: 'Provide product data sheet for Oxygen',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    color: '#10b981',
    category: 'Logistics',
    title: 'Track Delivery',
    description: 'Check the live delivery status of order LG-240001.',
    text: 'What is the delivery status of my order LG-240001?',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/>
        <path d="M16 8h4l3 3v5h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    color: '#8b5cf6',
    category: 'Scheduling',
    title: 'Book a Sales Call',
    description: 'Schedule a meeting with a Linde sales representative.',
    text: 'Can you setup a call with a Linde sales rep?',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    color: '#00b5e2',
    category: 'Quotation',
    title: 'O₂ Quotation',
    description: 'Get a price quotation for Oxygen gas.',
    text: 'Provide quotation for O2',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    color: '#f59e0b',
    category: 'Summary',
    title: 'CO₂ Full Summary',
    description: 'Display a detailed line-by-line breakdown of CO₂ data.',
    text: 'Display full detailed summary for CO2 line by line',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
  },
];

function QuickPromptsPanel({ onFillPrompt }: { onFillPrompt: (text: string) => void }) {
  return (
    <motion.div
      className="right-panel-card qp-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="right-panel-card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
        </svg>
        Quick Prompts
      </div>
      <p className="qp-hint">Click a prompt to fill the chat input — edit before sending.</p>
      <div className="qp-list">
        {QUICK_PROMPTS.map((p, i) => (
          <motion.button
            key={p.text}
            className="qp-item"
            onClick={() => onFillPrompt(p.text)}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.055, duration: 0.28, ease: 'easeOut' }}
            whileHover="hover"
          >
            <div className="qp-icon-badge" style={{ background: p.color + '1a', border: `1px solid ${p.color}33`, color: p.color }}>
              {p.icon}
            </div>
            <div className="qp-text">
              <span className="qp-title">{p.title}</span>
              <span className="qp-category" style={{ color: p.color }}>{p.category}</span>
              <span className="qp-desc">{p.description}</span>
            </div>
            <motion.div
              className="qp-arrow"
              variants={{ hover: { x: 3, opacity: 1 } }}
              initial={{ opacity: 0.35 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12,5 19,12 12,19"/>
              </svg>
            </motion.div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Confidence Bar ─────────────────────────────────────────── */
function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="right-panel-sublabel">AI Confidence</span>
        <motion.span
          key={pct}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}
        >
          {pct}%
        </motion.span>
      </div>
      <div className="confidence-track">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            borderRadius: 99,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Source Icon ─────────────────────────────────────────────── */
function SourceActionIcon({ url }: { url: string }) {
  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="source-row-action"
      title="Open document"
      onClick={e => { if (!url) e.preventDefault(); }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15,3 21,3 21,9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  );
}

function getDocTypeIcon(title: string, type: string) {
  const lower = (title + ' ' + type).toLowerCase();
  if (lower.includes('.pdf') || lower.includes('pdf')) {
    return (
      <div className="source-icon source-icon-pdf">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
        </svg>
      </div>
    );
  }
  if (lower.includes('trend') || lower.includes('chart') || lower.includes('data')) {
    return (
      <div className="source-icon source-icon-trend">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17l4-4 4 4 4-5 4 5"/>
          <path d="M3 17V7"/>
        </svg>
      </div>
    );
  }
  if (lower.includes('.docx') || lower.includes('.doc') || lower.includes('manual') || lower.includes('spec')) {
    return (
      <div className="source-icon source-icon-doc">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
        </svg>
      </div>
    );
  }
  return (
    <div className="source-icon source-icon-generic">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
      </svg>
    </div>
  );
}

/* ─── Contextual Actions ─────────────────────────────────────────── */
function ContextualActions({
  messages,
  onShowToast,
}: {
  messages: ChatMessage[];
  onShowToast?: (type: 'info' | 'success' | 'error', text: string, duration?: number) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const getConversationText = () => {
    return messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => `${m.role === 'user' ? 'User' : 'Linde AI'}: ${m.text}`)
      .join('\n\n');
  };

  const handleEmailSummary = async () => {
    try {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      if (!lastAssistant) {
        onShowToast?.('error', 'No conversation to summarise yet.', 1800);
        return;
      }
      const summary = `Linde Gas AI – Conversation Summary\n\n${lastAssistant.text}\n\nGenerated: ${new Date().toLocaleString()}`;
      await copyToClipboard(summary);
      onShowToast?.('success', 'Summary copied! Connect email workflow to enable sending.', 2800);
    } catch {
      onShowToast?.('error', 'Could not copy summary.', 1800);
    }
  };

  const handleGenerateReport = () => {
    const text = getConversationText();
    if (!text.trim()) {
      onShowToast?.('info', 'No conversation to export yet.', 1800);
      return;
    }
    const blob = new Blob([`# Linde Gas AI – Conversation Report\n\nGenerated: ${new Date().toLocaleString()}\n\n---\n\n${text}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linde-ai-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.('success', 'Report downloaded as Markdown.', 1800);
  };

  const handleUpdateKnowledgeBase = () => {
    setModalContent('To add a document to the knowledge base, upload a PDF or DOCX via your n8n workflow or contact your administrator to ingest new files.');
    setModalOpen(true);
  };

  return (
    <>
      <div className="right-panel-card">
        <div className="right-panel-card-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13,2 13,9 20,9"/>
          </svg>
          Contextual Actions
        </div>
        <div className="contextual-actions-list">
          <motion.button
            className="contextual-btn"
            onClick={handleEmailSummary}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            title="Copy summary to clipboard (connect email workflow to send)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            [Email Summary]
          </motion.button>

          <motion.button
            className="contextual-btn"
            onClick={handleGenerateReport}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            title="Export conversation as Markdown report"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            [Generate Report]
          </motion.button>

          <motion.button
            className="contextual-btn"
            onClick={handleUpdateKnowledgeBase}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            title="Learn how to update the knowledge base"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            [Update Knowledge Base]
          </motion.button>
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className="modal-card"
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 16 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <span>Update Knowledge Base</span>
                <button className="modal-close" onClick={() => setModalOpen(false)} title="Close">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-body">{modalContent}</div>
              <button className="modal-ok-btn" onClick={() => setModalOpen(false)}>Got it</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main Right Panel ──────────────────────────────────────────── */
export default function RightPanelContextSources({
  meta,
  hasResponded,
  lastSources,
  onDownload,
  messages,
  onShowToast,
  onFillPrompt,
}: RightPanelContextSourcesProps) {
  const { settings } = useSettings();
  const totalSources = lastSources.length ?? meta?.sources_used ?? 0;

  return (
    <div className="right-panel">
      {/* ── Quick Prompts — always visible when smartSuggestions is on ── */}
      {settings.smartSuggestions && onFillPrompt && <QuickPromptsPanel onFillPrompt={onFillPrompt} />}
      <motion.div
        className="right-panel-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        <div className="right-panel-card-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Context &amp; Sources
        </div>

        {/* Confidence */}
        <AnimatePresence mode="wait">
          {!hasResponded && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="right-panel-idle">
              Awaiting first response…
            </motion.div>
          )}
          {hasResponded && !meta && (
            <motion.div key="unavail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="right-panel-unavail">
              Confidence data unavailable
            </motion.div>
          )}
          {meta && (
            <motion.div key="meta" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {meta.confidence !== null ? (
                <ConfidenceBar value={meta.confidence} />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 8px' }}>
                  <span className="right-panel-sublabel">AI Confidence</span>
                  <span style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>—</span>
                </div>
              )}

              {/* Debug panel — visible only when Debug Mode is ON */}
              {settings.debugMode && (
                <div className="debug-panel">
                  <div className="debug-panel-header">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Debug · Raw Meta
                  </div>
                  <pre className="debug-json">{JSON.stringify(meta, null, 2)}</pre>
                  <div className="debug-row">
                    <span className="debug-key">Confidence</span>
                    <span className="debug-val">{meta.confidence !== null ? `${Math.round((meta.confidence ?? 0) * 100)}%` : 'N/A'}</span>
                  </div>
                  <div className="debug-row">
                    <span className="debug-key">Sources Used</span>
                    <span className="debug-val">{meta.sources_used}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sources Cited */}
        {hasResponded && (
          <div style={{ marginTop: 16 }}>
            <div className="right-panel-sources-header">
              <span className="right-panel-sublabel">Sources Cited:</span>
              <span className="sources-count-badge">({totalSources})</span>
            </div>

            {totalSources === 0 ? (
              <div className="right-panel-idle" style={{ marginTop: 8 }}>No sources cited yet.</div>
            ) : (
              <div className="sources-list">
                {lastSources.map((s, i) => (
                  <motion.div
                    key={s.doc_id || i}
                    className="source-row"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.22 }}
                  >
                    <span className="source-row-num">{i + 1}.</span>
                    {getDocTypeIcon(s.title, s.type ?? '')}
                    <div className="source-row-info">
                      <span className="source-row-title" title={s.title}>{s.title}</span>
                      {s.doc_id && <span className="source-row-id">{s.doc_id}</span>}
                    </div>
                    <SourceActionIcon url={s.file_url} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Contextual Actions Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        <ContextualActions messages={messages} onShowToast={onShowToast} />
      </motion.div>
    </div>
  );
}
