'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

const USER_NAME = 'John Doe';
const USER_INITIALS = 'JG';

interface TopBarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  messageCount?: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function TopBar({
  onToggleSidebar,
  sidebarOpen = true,
  messageCount = 0,
  searchQuery = '',
  onSearchChange,
}: TopBarProps) {
  const { theme, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <motion.header
      className="topbar-root"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── LEFT: brand ── */}
      <div className="topbar-left">
        <div className="topbar-brand">
          <div className="topbar-brand-icon">LG</div>
          <span className="topbar-brand-name">Linde Gas AI</span>
        </div>
      </div>

      {/* ── CENTER: Search ── */}
      <div className="topbar-search-wrap">
        <div className="topbar-search-inner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="topbar-search-icon">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            className="topbar-search-input"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={e => onSearchChange?.(e.target.value)}
            aria-label="Search conversations"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="topbar-search-clear"
                onClick={() => onSearchChange?.('')}
                title="Clear search"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT: controls ── */}
      <div className="topbar-right">
        {/* n8n workflow link */}
        <a
          href="https://n8n.io"
          target="_blank"
          rel="noopener noreferrer"
          className="n8n-badge-btn"
          title="Open n8n workflow"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17.8l-6.2 3.5 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          n8n Workflow
        </a>

        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <motion.button
            className="topbar-icon-btn notif-btn"
            onClick={() => setNotifOpen(o => !o)}
            whileTap={{ scale: 0.88 }}
            title="Notifications"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a7 7 0 0 1 7 7v4l2 2v1H3v-1l2-2V9a7 7 0 0 1 7-7zm0 20a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z"/>
            </svg>
            {messageCount > 0 && (
              <span className="topbar-notif-dot">{messageCount > 9 ? '9+' : messageCount}</span>
            )}
          </motion.button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="notif-dropdown"
                onMouseLeave={() => setNotifOpen(false)}
              >
                <div className="notif-header">Notifications</div>
                <div className="notif-empty">
                  {messageCount > 0 ? (
                    <span>{messageCount} active message{messageCount !== 1 ? 's' : ''} this session</span>
                  ) : (
                    <span>No new notifications</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <motion.button
          className="topbar-icon-btn"
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
        <div className="topbar-divider" />

        {/* User dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-user-btn"
            onClick={() => setUserMenuOpen(o => !o)}
            title="User menu"
          >
            <div className="topbar-user-info">
              <span className="topbar-username">{USER_NAME}</span>
              <span className="topbar-userstatus">
                <span className="status-dot" /> Online
              </span>
            </div>
            <div className="topbar-avatar">{USER_INITIALS}</div>
          </button>
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="user-dropdown"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="user-dropdown-header">
                  <div className="topbar-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{USER_INITIALS}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{USER_NAME}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Administrator</div>
                  </div>
                </div>
                <div className="user-dropdown-divider" />
                <button className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>Profile settings</button>
                <button className="user-dropdown-item" onClick={toggle}>
                  {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
