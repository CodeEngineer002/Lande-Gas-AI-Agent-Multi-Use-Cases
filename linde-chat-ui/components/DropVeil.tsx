'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface DropVeilProps {
  visible: boolean;
}

export default function DropVeil({ visible }: DropVeilProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="drop-veil"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="drop-veil-box"
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          >
            <div style={{ fontSize: 32, marginBottom: 10, textAlign: 'center' }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 800, textAlign: 'center' }}>Drop PDF here</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>
              Release to upload document
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
