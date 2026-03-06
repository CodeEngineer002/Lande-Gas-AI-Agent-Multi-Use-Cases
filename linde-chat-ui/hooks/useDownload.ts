'use client';
import { useState, useCallback } from 'react';
import type { DownloadPayload, EmailAllPayload } from '@/lib/types';
import { filenameFromCD } from '@/lib/utils';

export type DownloadStatus = 'idle' | 'loading';

interface UseDownloadOptions {
  onSuccess: (title: string, docId: string) => void;
  onError: (msg: string) => void;
  onEmailSuccess: () => void;
}

export function useDownload({ onSuccess, onError, onEmailSuccess }: UseDownloadOptions) {
  const [status, setStatus] = useState<DownloadStatus>('idle');

  const start = useCallback(
    async (payload: DownloadPayload) => {
      const isEmail = !!payload.email;
      setStatus('loading');
      try {
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (isEmail) {
          if (!res.ok) { onError('Email failed. Please try again.'); return; }
          onEmailSuccess();
          return;
        }

        if (!res.ok) {
          const j = await res.json().catch(() => ({})) as Record<string, unknown>;
          onError((j.error as string) || 'Download failed. Please try again.');
          return;
        }

        const contentType = res.headers.get('Content-Type') || '';
        if (!/pdf|octet-stream|binary/i.test(contentType)) {
          onError('Download not available.');
          return;
        }

        const fname =
          filenameFromCD(res.headers.get('Content-Disposition')) ||
          payload.filename ||
          'document.pdf';
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
        onSuccess(payload.filename, payload.doc_id);
      } catch (err) {
        console.error('[useDownload]', err);
        onError(isEmail ? 'Email failed. Please try again.' : 'Download failed. Please try again.');
      } finally {
        setStatus('idle');
      }
    },
    [onSuccess, onError, onEmailSuccess]
  );

  const startEmailAll = useCallback(
    async (payload: EmailAllPayload) => {
      setStatus('loading');
      try {
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({})) as Record<string, unknown>;
          onError((j.error as string) || 'Email failed. Please try again.');
          return;
        }
        onEmailSuccess();
      } catch (err) {
        console.error('[useDownload] emailAll', err);
        onError('Email failed. Please try again.');
      } finally {
        setStatus('idle');
      }
    },
    [onError, onEmailSuccess]
  );

  return { status, start, startEmailAll };
}
