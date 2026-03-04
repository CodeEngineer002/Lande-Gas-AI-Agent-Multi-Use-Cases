'use client';
import { useState, useEffect, useCallback } from 'react';
import type { DownloadHistoryEntry } from '@/lib/types';

const DLHIST_KEY = 'linde_download_history';

export function useDownloadHistory() {
  const [history, setHistory] = useState<DownloadHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DLHIST_KEY) || '[]');
      if (Array.isArray(saved)) setHistory(saved);
    } catch { /* ignore */ }
  }, []);

  const push = useCallback((entry: Omit<DownloadHistoryEntry, 'time'>) => {
    setHistory(prev => {
      const next = [{ ...entry, time: new Date().toISOString() }, ...prev].slice(0, 50);
      localStorage.setItem(DLHIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, push };
}
