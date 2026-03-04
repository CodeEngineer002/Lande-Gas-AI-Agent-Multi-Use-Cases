'use client';
import { motion } from 'framer-motion';
import type { Source, DownloadPayload, IntentType } from '@/lib/types';

const NO_CHIP_TYPES: IntentType[] = ['greeting', 'delivery_status', 'appointment'];

interface SourceChipsProps {
  sources: Source[];
  responseType?: IntentType;
  onDownload: (payload: DownloadPayload) => void;
}

function DownloadIcon() {
  return (
    <svg style={{ width: 12, height: 12, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L11 13.17V3h1zM5 18h14v2H5z"/>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg style={{ width: 13, height: 13, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 1.5V8h4.5L14 3.5zM9 13h6v1.5H9V13zm0 3h6v1.5H9V16zm0-6h3v1.5H9V10z"/>
    </svg>
  );
}

export default function SourceChips({ sources, responseType = '', onDownload }: SourceChipsProps) {
  if (NO_CHIP_TYPES.includes(responseType as IntentType)) return null;
  if (!sources || sources.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {sources.map((s, i) => (
        <motion.button
          key={s.doc_id || i}
          initial={{ opacity: 0, scale: 0.8, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.25, ease: 'backOut' }}
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          className="source-chip"
          onClick={() => onDownload({ doc_id: s.doc_id, filename: s.title, file_url: s.file_url })}
        >
          <FileIcon />
          <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.title || `Document ${i + 1}`}
          </span>
          <DownloadIcon />
        </motion.button>
      ))}
    </div>
  );
}
