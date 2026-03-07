/**
 * SettingsContext
 * ─────────────────────────────────────────────────────────────────
 * Central store for all user-configurable application settings.
 * Persists to localStorage under key `linde_settings_v1`.
 * Applies side effects (CSS vars, data-attributes) synchronously
 * inside useEffect so the DOM always reflects the current state.
 *
 * Backward compat: also exports `useTheme()` so existing components
 * that import from ThemeProvider.tsx continue to work unchanged.
 */
'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────────
export type ThemeMode    = 'dark' | 'light' | 'system';
export type FontSize     = 'sm' | 'md' | 'lg';
export type FontFamily   = 'inter' | 'mono' | 'system';
export type ResponseFmt  = 'structured-natural' | 'structured' | 'natural';
export type DateFmt      = 'iso' | 'human';
export type LandingPage  = 'home' | 'chat';
export type AccentColor  = string; // hex

export interface AppSettings {
  // ── General
  defaultLandingPage  : LandingPage;
  autoFocusInput      : boolean;
  clearOnRefresh      : boolean;
  debugMode           : boolean;
  fontSize            : FontSize;
  fontFamily          : FontFamily;

  // ── AI Behavior
  responseFormat      : ResponseFmt;
  dateFormat          : DateFmt;
  confidenceDisplay   : boolean;
  smartSuggestions    : boolean;

  // ── Appearance
  themeMode           : ThemeMode;
  accentColor         : AccentColor;
  compactMode         : boolean;

  // ── Notifications & Actions
  enableToasts        : boolean;
  enableSound         : boolean;
  confirmBeforeClear  : boolean;

  // ── Branding
  lindeBranding       : boolean;
}

const DEFAULTS: AppSettings = {
  defaultLandingPage  : 'chat',
  autoFocusInput      : true,
  clearOnRefresh      : false,
  debugMode           : false,
  fontSize            : 'md',
  fontFamily          : 'inter',

  responseFormat      : 'structured-natural',
  dateFormat          : 'human',
  confidenceDisplay   : true,
  smartSuggestions    : true,

  themeMode           : 'dark',
  accentColor         : '#006fbf',
  compactMode         : false,

  enableToasts        : true,
  enableSound         : false,
  confirmBeforeClear  : false,

  lindeBranding       : true,
};

const STORAGE_KEY = 'linde_settings_v1';
const ACCENT_VARS  = ['--brand', '--brand-rgb'];

// ── Context ────────────────────────────────────────────────────────
interface SettingsCtxValue {
  settings   : AppSettings;
  update     : <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetAll   : () => void;
  /** ISO timestamp of last manual save, or null before first change */
  savedAt    : string | null;
}

const SettingsCtx = createContext<SettingsCtxValue>({
  settings   : DEFAULTS,
  update     : () => {},
  resetAll   : () => {},
  savedAt    : null,
});

// ── Helper: resolve theme (handle 'system') ───────────────────────
function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return mode;
}

// ── Helper: apply all settings to DOM ─────────────────────────────
function applyToDom(s: AppSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // theme
  root.setAttribute('data-theme', resolveTheme(s.themeMode));

  // compact mode
  if (s.compactMode) root.setAttribute('data-compact', 'true');
  else root.removeAttribute('data-compact');

  // accent color
  root.style.setProperty('--brand', s.accentColor);
  // derive a lighter secondary (hue-shifted)
  root.style.setProperty('--brand-btn-bg', s.accentColor + '1a');

  // font family
  const fontMap: Record<FontFamily, string> = {
    inter  : "'Inter', 'Segoe UI', sans-serif",
    mono   : "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    system : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };
  root.style.setProperty('--font-family', fontMap[s.fontFamily]);

  // font size base
  const sizeMap: Record<FontSize, string> = {
    sm: '13px',
    md: '14px',
    lg: '16px',
  };
  root.style.setProperty('--font-size-base', sizeMap[s.fontSize]);

  // Linde branding
  if (s.lindeBranding) root.setAttribute('data-linde-branding', 'true');
  else root.removeAttribute('data-linde-branding');
}

// ── Provider ───────────────────────────────────────────────────────
export function SettingsProvider({ children }: { children: ReactNode }) {
  // Synchronous lazy init — reads localStorage on first render so defaultLandingPage
  // is available before any child component mounts.
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return DEFAULTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    } catch { /* ignore */ }
    return DEFAULTS;
  });

  const [savedAt, setSavedAt] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY + '_ts');
  });

  const systemListenerRef = useRef<(() => void) | null>(null);

  // Apply DOM side effects whenever settings change
  useEffect(() => {
    applyToDom(settings);

    // When 'system' mode, listen for OS-level theme changes
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const refresh = () => {
      if (settings.themeMode === 'system') {
        document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', refresh);
    systemListenerRef.current = () => mq.removeEventListener('change', refresh);
    return () => systemListenerRef.current?.();
  }, [settings]);

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        const ts = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY + '_ts', ts);
        setSavedAt(ts);
      } catch { /* ignore quota errors */ }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setSettings(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY + '_ts');
      setSavedAt(null);
    } catch { /* ignore */ }
    applyToDom(DEFAULTS);
  }, []);

  return (
    <SettingsCtx.Provider value={{ settings, update, resetAll, savedAt }}>
      {children}
    </SettingsCtx.Provider>
  );
}

// ── Hooks ──────────────────────────────────────────────────────────
export const useSettings = () => useContext(SettingsCtx);

/** Format a date string according to the user's dateFormat setting */
export function useDateFormatter() {
  const { settings } = useSettings();
  return (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      if (settings.dateFormat === 'iso') return d.toISOString().slice(0, 10);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };
}

/** Backward-compat shim — matches the old useTheme() API from ThemeProvider.tsx */
export function useTheme() {
  const { settings, update } = useSettings();
  const resolved = resolveTheme(settings.themeMode);
  const toggle   = () =>
    update('themeMode', resolved === 'dark' ? 'light' : 'dark');
  return { theme: resolved, toggle };
}

/**
 * Play an iPhone-style Tri-Tone notification via Web Audio API.
 * Three ascending sine notes (B6 → D#7 → G#7) with soft attack/decay,
 * closely mimicking the classic iOS message sound.
 */
export function playResponseChime() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Tri-tone notes: B6, D#7, G#7 — ascending major triad
    const notes = [
      { freq: 1976, start: 0,    dur: 0.10 },
      { freq: 2489, start: 0.14, dur: 0.10 },
      { freq: 1661, start: 0.28, dur: 0.16 },
    ];

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.18, ctx.currentTime);
    master.connect(ctx.destination);

    let lastEnd = 0;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = n.freq;
      osc.connect(env);
      env.connect(master);

      const t0 = ctx.currentTime + n.start;
      const t1 = t0 + n.dur;

      // Soft attack → sustain → smooth decay
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(1, t0 + 0.012);
      env.gain.setValueAtTime(1, t0 + n.dur * 0.55);
      env.gain.exponentialRampToValueAtTime(0.001, t1 + 0.08);

      osc.start(t0);
      osc.stop(t1 + 0.08);
      lastEnd = Math.max(lastEnd, t1 + 0.08);
    }

    // Clean up AudioContext after all notes finish
    setTimeout(() => ctx.close().catch(() => {}), (lastEnd - ctx.currentTime) * 1000 + 100);
  } catch { /* ignore in SSR or restricted contexts */ }
}
