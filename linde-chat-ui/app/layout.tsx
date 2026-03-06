import type { Metadata } from 'next';
import './globals.css';
import './linde-branding.css';
import { SettingsProvider } from '@/lib/settingsContext';

export const metadata: Metadata = {
  title: 'Linde Gas AI Agent',
  description:
    'AI-powered assistant for Linde Gas — datasheets, quotations, delivery status, availability, and scheduling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'var(--font-family, Inter, sans-serif)' }}>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}

