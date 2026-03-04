'use client';
import { motion } from 'framer-motion';

interface InlineAssistantActionsProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const INLINE_ACTIONS = [
  {
    label: 'View Daily Report',
    prompt: 'Please provide the daily operations report and any key metrics for today.',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Compare Trends',
    prompt: 'Can you compare the current purity levels and values against historical trends?',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    ),
  },
  {
    label: 'Create Purity Alert',
    prompt: 'Please set up a purity alert for when oxygen concentration falls below the threshold specification.',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    label: 'Check Safety Docs',
    prompt: 'Please provide the relevant safety documentation, hazard warnings, and handling guidelines for this product.',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
] as const;

export default function InlineAssistantActions({ onSend, disabled = false }: InlineAssistantActionsProps) {
  return (
    <div className="inline-actions-strip">
      {INLINE_ACTIONS.map(({ label, prompt, icon }, i) => (
        <motion.button
          key={label}
          className="inline-action-chip"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.22, ease: 'backOut' }}
          whileHover={{ y: -1, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => !disabled && onSend(prompt)}
          disabled={disabled}
          title={`Send: "${label}"`}
        >
          <span className="inline-action-icon">{icon}</span>
          [{label}]
        </motion.button>
      ))}
    </div>
  );
}
