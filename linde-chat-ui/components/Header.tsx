'use client';
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

const USER_NAME = 'Mr. Bond';
const initials = USER_NAME.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  messageCount?: number;
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function AISparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17.8l-6.2 3.5 2.4-7.4L2 9.4h7.6z" opacity="0.9"/>
    </svg>
  );
}

function SidebarIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </>
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="14" y1="9" x2="17" y2="12"/>
          <line x1="14" y1="15" x2="17" y2="12"/>
        </>
      )}
    </svg>
  );
}

export default function Header({ onToggleSidebar, sidebarOpen = true, messageCount = 0 }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <motion.header
      className="header-root glass"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Left: sidebar toggle + brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Sidebar toggle */}
        <motion.button
          className="theme-toggle"
          onClick={onToggleSidebar}
          whileTap={{ scale: 0.88 }}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label="Toggle sidebar"
        >
          <SidebarIcon open={sidebarOpen} />
        </motion.button>

        <div className="brand-icon">
          LG
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontWeight: 900,
                fontSize: 17,
                letterSpacing: '-0.3px',
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Linde Gas
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '1px 7px', borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(0,111,191,0.12), rgba(0,181,226,0.12))',
              border: '1px solid rgba(0,181,226,0.28)',
              fontSize: 10, fontWeight: 700,
              color: 'var(--brand-2)',
              letterSpacing: '0.3px',
            }}>
              <AISparkleIcon /> AI
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1, fontWeight: 500 }}>
            Industrial Gases Agent
          </div>
        </div>
      </div>

      {/* ── Right controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Message count badge */}
        <AnimatePresence>
          {messageCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 8,
                background: 'rgba(0,111,191,0.08)',
                border: '1px solid rgba(0,111,191,0.15)',
                fontSize: 11, color: 'var(--muted)', fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
              title="Messages sent this session"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--brand)', opacity: 0.8 }}>
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              {messageCount} msg{messageCount !== 1 ? 's' : ''}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Model badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 8,
          background: 'rgba(0,111,191,0.06)',
          border: '1px solid rgba(0,111,191,0.12)',
          fontSize: 11,
          color: 'var(--muted)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
          className="header-model-badge"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--brand-2)', opacity: 0.9 }}>
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          </svg>
          n8n Workflow
        </div>

        {/* Theme toggle */}
        <motion.button
          key={theme}
          className="theme-toggle"
          onClick={toggle}
          whileTap={{ scale: 0.88 }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.22, ease: 'backOut' }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--assistBorder)', opacity: 0.7 }} />

        {/* User info */}
        <div style={{ textAlign: 'right' }} className="header-user-info">
          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)', lineHeight: 1.3 }}>
            {USER_NAME}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--muted)', justifyContent: 'flex-end', marginTop: 1 }}>
            <span className="status-dot" />
            Online
          </div>
        </div>

        {/* Avatar */}
        <div className="avatar-chip">
          {initials}
        </div>
      </div>
    </motion.header>
  );
}
