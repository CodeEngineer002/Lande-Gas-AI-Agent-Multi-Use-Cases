'use client';
import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import type { DownloadPayload, EmailAllPayload, Source } from '@/lib/types';
import { filenameFromCD } from '@/lib/utils';

export type DownloadStatus = 'idle' | 'loading';

interface UseDownloadOptions {
  onSuccess: (title: string, docId: string) => void;
  onError: (msg: string) => void;
  onEmailSuccess: () => void;
  onZipSuccess?: () => void;
}

export function useDownload({ onSuccess, onError, onEmailSuccess, onZipSuccess }: UseDownloadOptions) {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number } | null>(null);

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

  /** Download all sources as a single ZIP file */
  const startDownloadAll = useCallback(
    async (sources: Source[]) => {
      if (!sources.length) return;
      setStatus('loading');
      setZipProgress({ current: 0, total: sources.length });

      try {
        const zip = new JSZip();
        let succeeded = 0;

        // Fetch each file in parallel (limited concurrency)
        const results = await Promise.allSettled(
          sources.map(async (src, idx) => {
            const payload: DownloadPayload = {
              doc_id: src.doc_id,
              filename: src.title || `document_${idx + 1}.pdf`,
              file_url: src.file_url,
            };
            const res = await fetch('/api/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`Failed to download ${payload.filename}`);

            const fname =
              filenameFromCD(res.headers.get('Content-Disposition')) ||
              payload.filename ||
              `document_${idx + 1}.pdf`;
            const blob = await res.blob();
            return { fname, blob };
          })
        );

        // Add successful downloads to zip
        const usedNames = new Set<string>();
        for (const result of results) {
          if (result.status === 'fulfilled') {
            let name = result.value.fname;
            // Deduplicate file names
            while (usedNames.has(name)) {
              const dotIdx = name.lastIndexOf('.');
              if (dotIdx > 0) {
                name = `${name.slice(0, dotIdx)}_copy${name.slice(dotIdx)}`;
              } else {
                name = `${name}_copy`;
              }
            }
            usedNames.add(name);
            zip.file(name, result.value.blob);
            succeeded++;
            setZipProgress({ current: succeeded, total: sources.length });
          }
        }

        if (succeeded === 0) {
          onError('Could not download any files.');
          return;
        }

        // Generate zip and trigger browser download
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const href = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = href;
        a.download = 'Linde_Documents.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);

        if (succeeded < sources.length) {
          onError(`Downloaded ${succeeded} of ${sources.length} files.`);
        }
        onZipSuccess?.();
      } catch (err) {
        console.error('[useDownload] downloadAll', err);
        onError('ZIP download failed. Please try again.');
      } finally {
        setStatus('idle');
        setZipProgress(null);
      }
    },
    [onError, onZipSuccess]
  );

  return { status, zipProgress, start, startEmailAll, startDownloadAll };
}
