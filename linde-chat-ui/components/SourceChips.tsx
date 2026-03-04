'use client';
import { motion } from 'framer-motion';
import type { Source, DownloadPayload, IntentType } from '@/lib/types';

const NO_CHIP_TYPES: IntentType[] = ['greeting', 'delivery_status', 'appointment'];

interface SourceChipsProps {
  sources: Source[];
  responseType?: IntentType;
  onDownload: (payload: DownloadPayload) => void;
}

// ── File type detection ──────────────────────────────────────────────────────
function getFileType(filename: string): 'pdf' | 'doc' | 'txt' | 'xls' | 'generic' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'doc';
  if (ext === 'txt' || ext === 'md') return 'txt';
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return 'xls';
  return 'generic';
}

const FILE_TYPE_META: Record<string, { label: string; bg: string; color: string; badgeBg: string }> = {
  pdf:     { label: 'PDF',      bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', badgeBg: 'rgba(239,68,68,0.18)' },
  doc:     { label: 'DOC',      bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', badgeBg: 'rgba(59,130,246,0.18)' },
  txt:     { label: 'TXT',      bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', badgeBg: 'rgba(148,163,184,0.18)' },
  xls:     { label: 'XLS',      bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', badgeBg: 'rgba(34,197,94,0.18)' },
  generic: { label: 'FILE',     bg: 'rgba(100,116,139,0.12)', color: '#64748b', badgeBg: 'rgba(100,116,139,0.18)' },
};

// ── File type SVG icons ──────────────────────────────────────────────────────
function FileTypeIcon({ type, color }: { type: string; color: string }) {
  if (type === 'pdf') {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="1" width="14" height="18" rx="2" fill={color} opacity="0.18"/>
        <rect x="3" y="1" width="14" height="18" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
        <path d="M7 5h6M7 8h6M7 11h4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
        <rect x="13" y="14" width="8" height="9" rx="1.5" fill={color}/>
        <text x="17" y="21" textAnchor="middle" fontSize="5" fontWeight="800" fill="white" fontFamily="sans-serif">PDF</text>
      </svg>
    );
  }
  if (type === 'doc') {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="1" width="14" height="18" rx="2" fill={color} opacity="0.18"/>
        <rect x="3" y="1" width="14" height="18" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
        <path d="M7 5h6M7 8h6M7 11h6M7 14h4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
        <rect x="13" y="14" width="8" height="9" rx="1.5" fill={color}/>
        <text x="17" y="21" textAnchor="middle" fontSize="4.5" fontWeight="800" fill="white" fontFamily="sans-serif">DOC</text>
      </svg>
    );
  }
  if (type === 'xls') {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="1" width="14" height="18" rx="2" fill={color} opacity="0.18"/>
        <rect x="3" y="1" width="14" height="18" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
        <path d="M7 6h6M7 9.5h6M7 13h6" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
        <rect x="13" y="14" width="8" height="9" rx="1.5" fill={color}/>
        <text x="17" y="21" textAnchor="middle" fontSize="4.5" fontWeight="800" fill="white" fontFamily="sans-serif">XLS</text>
      </svg>
    );
  }
  if (type === 'txt') {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="1" width="14" height="18" rx="2" fill={color} opacity="0.18"/>
        <rect x="3" y="1" width="14" height="18" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
        <path d="M7 6h6M7 9.5h6M7 13h4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
        <text x="17" y="21" textAnchor="middle" fontSize="4.5" fontWeight="800" fill={color} fontFamily="sans-serif">TXT</text>
      </svg>
    );
  }
  // generic
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        fill={color} opacity="0.18" stroke={color} strokeWidth="1.5"/>
      <path d="M14 2v6h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 13h6M9 16h4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function DownloadArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L11 13.17V3h1zM5 18h14v2H5z"/>
    </svg>
  );
}

// ── Intent → subtitle label ──────────────────────────────────────────────────
const INTENT_LABEL: Partial<Record<IntentType, string>> = {
  datasheet:   'Product Datasheet',
  quotation:   'Quotation',
  availability: 'Availability Report',
};

// ── Single document card ─────────────────────────────────────────────────────
function DocCard({
  source, index, responseType, onDownload,
}: {
  source: Source;
  index: number;
  responseType: IntentType;
  onDownload: (p: DownloadPayload) => void;
}) {
  const title = source.title || `Document ${index + 1}`;
  const fileType = getFileType(title);
  const meta = FILE_TYPE_META[fileType];
  const subtitle = INTENT_LABEL[responseType] ?? meta.label;

  const handleDownload = () =>
    onDownload({ doc_id: source.doc_id, filename: title, file_url: source.file_url });

  return (
    <motion.div
      role="group"
      aria-label={`Document: ${title}`}
      className="doc-card"
      style={{ '--doc-color': meta.color, '--doc-bg': meta.bg } as React.CSSProperties}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Left: icon badge */}
      <div className="doc-card-icon" style={{ background: meta.bg }}>
        <FileTypeIcon type={fileType} color={meta.color} />
      </div>

      {/* Middle: name + subtitle */}
      <div className="doc-card-info">
        <span className="doc-card-title" title={title}>{title}</span>
        <span className="doc-card-sub">{subtitle}</span>
      </div>

      {/* Right: download button */}
      <button
        className="doc-card-dl"
        onClick={handleDownload}
        aria-label={`Download ${title}`}
        title={`Download ${title}`}
        type="button"
      >
        <DownloadArrowIcon />
      </button>
    </motion.div>
  );
}

// ── SourceChips (renamed to DocCards internally, same export name) ────────────
export default function SourceChips({ sources, responseType = '', onDownload }: SourceChipsProps) {
  if (NO_CHIP_TYPES.includes(responseType as IntentType)) return null;
  if (!sources || sources.length === 0) return null;

  return (
    <div className="doc-card-list">
      {sources.map((s, i) => (
        <DocCard
          key={s.doc_id || i}
          source={s}
          index={i}
          responseType={responseType as IntentType}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}
