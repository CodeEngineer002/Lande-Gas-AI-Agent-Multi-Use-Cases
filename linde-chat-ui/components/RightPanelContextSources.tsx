'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResponseMeta, Source, DownloadPayload, ChatMessage } from '@/lib/types';

interface RightPanelContextSourcesProps {
  meta: ResponseMeta | null;
  hasResponded: boolean;
  lastSources: Source[];
  onDownload: (payload: DownloadPayload) => void;
  messages: ChatMessage[];
  onShowToast?: (type: 'info' | 'success' | 'error', text: string, duration?: number) => void;
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

  const handleEmailSummary = () => {
    try {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      if (!lastAssistant) {
        onShowToast?.('error', 'No conversation to summarise yet.', 1800);
        return;
      }
      const summary = `Linde Gas AI – Conversation Summary\n\n${lastAssistant.text}\n\nGenerated: ${new Date().toLocaleString()}`;
      navigator.clipboard.writeText(summary).then(() => {
        onShowToast?.('success', 'Summary copied! Connect email workflow to enable sending.', 2800);
      });
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
}: RightPanelContextSourcesProps) {
  const totalSources = lastSources.length ?? meta?.sources_used ?? 0;

  return (
    <div className="right-panel">
      {/* ── Context & Sources Card ── */}
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
              <ConfidenceBar value={meta.confidence ?? 0} />
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
