'use client';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  { label: 'Oxygen datasheet', text: 'Provide product data sheet for Oxygen', emoji: '📄' },
  { label: 'Delivery status', text: 'What is the delivery status of my order LG-240001?', emoji: '🚚' },
  { label: 'Schedule a call', text: 'Can you setup a call with a Linde sales rep?', emoji: '📅' },
  { label: 'O₂ Quotation', text: 'Provide quotation for O2', emoji: '💰' },
  { label: 'CO₂ summary', text: 'Display full detailed summary for CO2 line by line', emoji: '🌿' },
] as const;

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
  visible: boolean;
}

export default function SuggestionChips({ onSelect, visible }: SuggestionChipsProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ padding: '4px 0 10px' }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: 8,
              paddingLeft: 2,
            }}>
              Quick Prompts
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} className="chip-wrap-mobile">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s.text}
                  className="chip-btn chip-enter"
                  onClick={() => onSelect(s.text)}
                  style={{ animationDelay: `${i * 0.07}s` }}
                  whileHover={{ y: -3, scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.7, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.32, ease: 'backOut' }}
                  title={s.text}
                >
                  <span style={{ fontSize: 14 }}>{s.emoji}</span>
                  {s.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
