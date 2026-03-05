/**
 * ThemeProvider — backward-compat shim
 * ─────────────────────────────────────────────────────────────────
 * Full theme + all app settings are now managed by SettingsContext.
 * This file re-exports so existing import sites work unchanged.
 */
'use client';
export { useTheme, SettingsProvider as ThemeProvider } from '@/lib/settingsContext';
