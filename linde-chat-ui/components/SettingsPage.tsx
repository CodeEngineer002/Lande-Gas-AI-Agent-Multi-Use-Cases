'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/lib/settingsContext';
import type { AppSettings, AccentColor } from '@/lib/settingsContext';

// ── Reusable primitives ───────────────────────────────────────────

function SectionCard({
  title, subtitle, icon, children,
}: {
  title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <motion.div
      className="sp-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sp-card-header">
        <div className="sp-card-icon">{icon}</div>
        <div>
          <div className="sp-card-title">{title}</div>
          {subtitle && <div className="sp-card-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="sp-card-body">{children}</div>
    </motion.div>
  );
}

function SettingRow({
  label, description, children, last,
}: {
  label: string; description?: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <div className={`sp-row${last ? ' sp-row-last' : ''}`}>
      <div className="sp-row-text">
        <div className="sp-row-label">{label}</div>
        {description && <div className="sp-row-desc">{description}</div>}
      </div>
      <div className="sp-row-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`sp-toggle${checked ? ' sp-toggle-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <motion.span
        className="sp-toggle-thumb"
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function Select<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      className="sp-select"
      value={value}
      onChange={e => onChange(e.target.value as T)}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Accent color swatches ─────────────────────────────────────────
const ACCENT_COLORS: { color: AccentColor; label: string }[] = [
  { color: '#006fbf', label: 'Linde Blue'    },
  { color: '#00b5e2', label: 'Sky Blue'      },
  { color: '#10b981', label: 'Enterprise Green' },
  { color: '#6366f1', label: 'Indigo'        },
  { color: '#8b5cf6', label: 'Violet'        },
  { color: '#f59e0b', label: 'Amber'         },
  { color: '#ef4444', label: 'Red'           },
  { color: '#ec4899', label: 'Rose'          },
];

function AccentPicker({
  value, onChange,
}: {
  value: AccentColor;
  onChange: (c: AccentColor) => void;
}) {
  return (
    <div className="sp-accent-grid">
      {ACCENT_COLORS.map(({ color, label }) => (
        <button
          key={color}
          className={`sp-accent-swatch${value === color ? ' sp-accent-active' : ''}`}
          style={{ background: color }}
          title={label}
          aria-label={label}
          onClick={() => onChange(color)}
        >
          {value === color && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

// ── System info row ───────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="sp-info-row">
      <span className="sp-info-label">{label}</span>
      <span className="sp-info-value">{value}</span>
    </div>
  );
}

// ── Section icons ─────────────────────────────────────────────────
const Icons = {
  General: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  AI: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M5 14v2a1 1 0 0 0 1 1h1v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3h1a1 1 0 0 0 1-1v-2H5z"/>
    </svg>
  ),
  Appearance: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 0 1 0 20 5 5 0 0 1 0-10z"/>
    </svg>
  ),
  Notifications: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  System: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
};

// ── Main component ────────────────────────────────────────────────
export default function SettingsPage() {
  const { settings, update, resetAll, savedAt } = useSettings();
  const [resetConfirm, setResetConfirm] = useState(false);

  const set = <K extends keyof AppSettings>(key: K) =>
    (value: AppSettings[K]) => update(key, value);

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    resetAll();
    setResetConfirm(false);
  };

  return (
    <motion.section
      className="settings-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page header */}
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Settings</h1>
          <p className="sp-page-subtitle">Configure Linde Gas AI Agent to match your workflow</p>
        </div>
        <div className="sp-header-actions">
          {savedAt && (
            <span className="sp-saved-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              Saved {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <motion.button
            className={`sp-reset-btn${resetConfirm ? ' sp-reset-confirm' : ''}`}
            onClick={handleReset}
            onBlur={() => setResetConfirm(false)}
            whileTap={{ scale: 0.95 }}
          >
            {resetConfirm ? 'Confirm reset?' : 'Reset to defaults'}
          </motion.button>
        </div>
      </div>

      <div className="sp-grid">

        {/* ── Section 1: General ── */}
        <SectionCard
          title="General Settings"
          subtitle="Core application behaviour and interface preferences"
          icon={Icons.General}
        >
          <SettingRow
            label="Default Landing Page"
            description="Page shown when the application first loads."
          >
            <Select
              value={settings.defaultLandingPage}
              onChange={set('defaultLandingPage')}
              options={[
                { value: 'chat', label: 'Chat' },
                { value: 'home', label: 'Home Dashboard' },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Auto-Focus Chat Input"
            description="Automatically focus the message input after the AI responds."
          >
            <Toggle checked={settings.autoFocusInput} onChange={set('autoFocusInput')} />
          </SettingRow>

          <SettingRow
            label="Clear Conversation on Refresh"
            description="Wipe the chat history when the page is reloaded."
          >
            <Toggle checked={settings.clearOnRefresh} onChange={set('clearOnRefresh')} />
          </SettingRow>

          <SettingRow
            label="Debug Mode"
            description="Show raw JSON response, intent name, and confidence in the right panel."
          >
            <Toggle checked={settings.debugMode} onChange={set('debugMode')} />
          </SettingRow>

          <SettingRow
            label="Font Size"
            description="Base font size used throughout the interface."
          >
            <Select
              value={settings.fontSize}
              onChange={set('fontSize')}
              options={[
                { value: 'sm', label: 'Small (13 px)' },
                { value: 'md', label: 'Medium (14 px)' },
                { value: 'lg', label: 'Large (16 px)' },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Font Family"
            description="Typeface applied to the entire application."
            last
          >
            <Select
              value={settings.fontFamily}
              onChange={set('fontFamily')}
              options={[
                { value: 'inter',  label: 'Inter (default)' },
                { value: 'mono',   label: 'Monospace (code-style)' },
                { value: 'system', label: 'System UI' },
              ]}
            />
          </SettingRow>
        </SectionCard>

        {/* ── Section 2: AI Behaviour ── */}
        <SectionCard
          title="AI Behavior Settings"
          subtitle="Control how AI responses are interpreted and displayed"
          icon={Icons.AI}
        >
          <SettingRow
            label="Response Format Preference"
            description="How structured data (tables, cards) and natural language are combined."
          >
            <Select
              value={settings.responseFormat}
              onChange={set('responseFormat')}
              options={[
                { value: 'structured-natural', label: 'Structured + Natural (default)' },
                { value: 'structured',          label: 'Structured Only'               },
                { value: 'natural',             label: 'Natural Language Only'         },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Date Format"
            description="How dates are rendered in delivery status and other views."
          >
            <Select
              value={settings.dateFormat}
              onChange={set('dateFormat')}
              options={[
                { value: 'human', label: 'Human Readable (Nov 3, 2026)' },
                { value: 'iso',   label: 'ISO 8601 (YYYY-MM-DD)'        },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Show AI Confidence Meter"
            description="Display the confidence percentage bar in the context panel."
          >
            <Toggle checked={settings.confidenceDisplay} onChange={set('confidenceDisplay')} />
          </SettingRow>

          <SettingRow
            label="Smart Quick Suggestions"
            description="Show contextual quick-prompt chips on the empty chat screen."
            last
          >
            <Toggle checked={settings.smartSuggestions} onChange={set('smartSuggestions')} />
          </SettingRow>
        </SectionCard>

        {/* ── Section 3: Appearance ── */}
        <SectionCard
          title="Appearance Settings"
          subtitle="Visual theme, layout density, and branding colours"
          icon={Icons.Appearance}
        >
          <SettingRow
            label="Theme Mode"
            description="Dark matches the Linde enterprise palette. System follows OS preference."
          >
            <Select
              value={settings.themeMode}
              onChange={set('themeMode')}
              options={[
                { value: 'dark',   label: 'Dark (default)' },
                { value: 'light',  label: 'Light'          },
                { value: 'system', label: 'System'         },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Accent Color"
            description="Primary colour used for buttons, highlights, and active states."
          >
            <AccentPicker value={settings.accentColor} onChange={set('accentColor')} />
          </SettingRow>

          <SettingRow
            label="Compact Mode"
            description="Reduce padding and spacing for higher information density."
            last
          >
            <Toggle checked={settings.compactMode} onChange={set('compactMode')} />
          </SettingRow>
        </SectionCard>

        {/* ── Section 4: Notifications & Actions ── */}
        <SectionCard
          title="Notifications & Actions"
          subtitle="Toast alerts, audio feedback, and destructive-action safeguards"
          icon={Icons.Notifications}
        >
          <SettingRow
            label="Enable Toast Notifications"
            description="Show success / error / info pop-ups for downloads and actions."
          >
            <Toggle checked={settings.enableToasts} onChange={set('enableToasts')} />
          </SettingRow>

          <SettingRow
            label="Sound on AI Response"
            description="Play a subtle chime when the AI finishes answering."
          >
            <Toggle checked={settings.enableSound} onChange={set('enableSound')} />
          </SettingRow>

          <SettingRow
            label="Confirm Before Clearing Chat"
            description="Require confirmation before wiping the conversation history."
            last
          >
            <Toggle checked={settings.confirmBeforeClear} onChange={set('confirmBeforeClear')} />
          </SettingRow>
        </SectionCard>

        {/* ── Section 5: System Information ── */}
        <SectionCard
          title="System Information"
          subtitle="Read-only runtime values and environment details"
          icon={Icons.System}
        >
          <div className="sp-info-block">
            <InfoRow label="Application"      value="Linde Gas AI Agent" />
            <InfoRow label="Version"          value="1.0.0" />
            <InfoRow label="UI Framework"     value="Next.js 14 + React 18" />
            <InfoRow label="AI Engine"        value="N8N Workflow · Claude (Anthropic)" />
            <InfoRow
              label="Webhook Endpoint"
              value={
                typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WEBHOOK_URL
                  ? process.env.NEXT_PUBLIC_WEBHOOK_URL
                  : 'Configured via NEXT_PUBLIC_WEBHOOK_URL'
              }
            />
            <InfoRow label="Environment"      value={process.env.NODE_ENV ?? 'production'} />
            <InfoRow label="Build Date"       value="March 2026" />
            <InfoRow
              label="Settings Saved"
              value={savedAt ? new Date(savedAt).toLocaleString() : 'Not yet modified'}
            />
          </div>
        </SectionCard>

      </div>
    </motion.section>
  );
}
