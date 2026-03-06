"use client";
import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import BackgroundLayer from "@/components/BackgroundLayer";
import TopBar from "@/components/TopBar";
import LeftSidebarEnterprise from "@/components/LeftSidebarEnterprise";
import ChatThread from "@/components/ChatThread";
import Composer from "@/components/Composer";
import type { ComposerHandle } from "@/components/Composer";
import ToastHost from "@/components/ToastHost";
import DropVeil from "@/components/DropVeil";
import RightPanelContextSources from "@/components/RightPanelContextSources";
import HomeDashboard from "@/components/HomeDashboard";
import SettingsPage from "@/components/SettingsPage";
import { useSettings, playResponseChime } from "@/lib/settingsContext";
import { useChat } from "@/hooks/useChat";
import { useDownload } from "@/hooks/useDownload";
import { useDownloadHistory } from "@/hooks/useDownloadHistory";
import { useToast } from "@/hooks/useToast";
import type { ChatMessage, DownloadPayload } from "@/lib/types";

export default function Page() {
  const { state, send, clear, initWelcome } = useChat();
  const { settings } = useSettings();
  const { toasts, showToast: _showToast, dismissToast } = useToast();
  // Gate toast calls through enableToasts setting
  const showToast = useCallback<typeof _showToast>(
    (type, text, duration) => {
      if (!settings.enableToasts) return () => {};
      return _showToast(type, text, duration);
    },
    [_showToast, settings.enableToasts]
  );
  const { history: dlHistory, push: pushDlHistory } = useDownloadHistory();
  const [dragOver, setDragOver] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Always start with 'chat' for SSR/hydration stability;
  // switch to the saved landing page after mount to avoid hydration mismatch.
  const [currentPage, setCurrentPage] = useState<'home' | 'chat' | 'settings'>('chat');
  const didApplyLandingPage = useRef(false);
  const dragCountRef = useRef(0);
  const hasWelcome = useRef(false);
  const composerRef = useRef<ComposerHandle>(null);
  const messageCount = state.messages.filter(m => m.role === 'user').length;

  // Derive conversation title from first user message
  const conversationTitle = useMemo(() => {
    const firstUser = state.messages.find(m => m.role === 'user');
    if (!firstUser) return 'New Conversation';
    const words = firstUser.text.trim().split(/\s+/).slice(0, 6).join(' ');
    return words.length < firstUser.text.trim().length ? words + '…' : words;
  }, [state.messages]);

  useEffect(() => {
    if (!hasWelcome.current) {
      hasWelcome.current = true;
      // Clear chat on refresh if configured
      if (settings.clearOnRefresh) clear();
      initWelcome();
    }
    // Apply saved landing page once after first mount (avoids SSR hydration mismatch)
    if (!didApplyLandingPage.current) {
      didApplyLandingPage.current = true;
      if (settings.defaultLandingPage !== 'chat') {
        setCurrentPage(settings.defaultLandingPage);
      }
    }
  }, [initWelcome, clear, settings.clearOnRefresh, settings.defaultLandingPage]);

  // Re-focus the composer whenever the AI finishes responding (isTyping goes false)
  const prevIsTyping = useRef(false);
  useEffect(() => {
    if (prevIsTyping.current && !state.isTyping) {
      // Play chime if enabled
      if (settings.enableSound) playResponseChime();
      // Auto-focus if enabled
      if (settings.autoFocusInput) {
        const id = setTimeout(() => composerRef.current?.focus(), 80);
        return () => clearTimeout(id);
      }
    }
    prevIsTyping.current = state.isTyping;
  }, [state.isTyping, settings.autoFocusInput, settings.enableSound]);

  useEffect(() => {
    const enter = (e: DragEvent) => { e.preventDefault(); dragCountRef.current++; setDragOver(true); };
    const leave = (e: DragEvent) => {
      e.preventDefault();
      dragCountRef.current = Math.max(0, dragCountRef.current - 1);
      if (!dragCountRef.current) setDragOver(false);
    };
    const drop = (e: DragEvent) => {
      e.preventDefault(); dragCountRef.current = 0; setDragOver(false);
      const files = Array.from((e.dataTransfer as DataTransfer)?.files || []).filter(f => /\.pdf$/i.test(f.name));
      if (files.length) showToast('info', 'File upload is not configured in this deployment.', 2500);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragover', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, [showToast]);

  const pendingInfoToast = useRef<(() => void) | null>(null);

  const { start: startDownload, startEmailAll } = useDownload({
    onSuccess: (title, docId) => {
      pendingInfoToast.current?.(); pendingInfoToast.current = null;
      showToast('success', 'Successfully downloaded', 1400);
      pushDlHistory({ title, doc_id: docId });
    },
    onError: (msg) => {
      pendingInfoToast.current?.(); pendingInfoToast.current = null;
      showToast('error', msg, 1800);
    },
    onEmailSuccess: () => {
      pendingInfoToast.current?.(); pendingInfoToast.current = null;
      showToast('success', 'Email sent successfully', 1400);
    },
  });

  const handleDownload = useCallback(
    (payload: DownloadPayload) => {
      pendingInfoToast.current = showToast('info', 'Downloading the PDF now…', 0);
      startDownload(payload);
    },
    [startDownload, showToast]
  );

  const handleEmailFirstSource = useCallback(
    (sources: ChatMessage['sources']) => {
      if (!sources.length) { showToast('error', 'No document to email.', 1600); return; }
      const lastEmail = typeof window !== 'undefined' ? localStorage.getItem('linde_last_email') || '' : '';
      const addr = window.prompt('Enter recipient email:', lastEmail);
      if (!addr) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) { showToast('error', 'Invalid email address.', 1600); return; }
      localStorage.setItem('linde_last_email', addr);
      pendingInfoToast.current = showToast('info', 'Sending email…', 0);

      if (sources.length === 1) {
        // Single file: use existing flow (downloads PDF via Google Drive + Gmail attachment)
        const s = sources[0];
        startDownload({ doc_id: s.doc_id, filename: s.title, file_url: s.file_url, email: addr });
      } else {
        // Multiple files: send all file info for a single email with all download links
        startEmailAll({
          email: addr,
          files: sources
            .filter(s => s.file_url && s.file_url.trim() !== '')
            .map(s => ({ doc_id: s.doc_id, filename: s.title, file_url: s.file_url })),
        });
      }
    },
    [startDownload, startEmailAll, showToast]
  );

  const handleEmailDelivery = useCallback(
    (deliveryData: ChatMessage['deliveryData']) => {
      if (!deliveryData) { showToast('error', 'No tracking data to email.', 1600); return; }
      const lastEmail = typeof window !== 'undefined' ? localStorage.getItem('linde_last_email') || '' : '';
      const addr = window.prompt('Enter recipient email:', lastEmail);
      if (!addr) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) { showToast('error', 'Invalid email address.', 1600); return; }
      localStorage.setItem('linde_last_email', addr);
      const dismiss = showToast('info', 'Sending tracking snapshot…', 0);
      fetch('/api/email-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr, tracking_data: deliveryData }),
      })
        .then(async (res) => {
          dismiss();
          if (res.ok) { showToast('success', 'Tracking snapshot sent!', 1600); }
          else {
            const j = await res.json().catch(() => ({})) as { error?: string };
            showToast('error', j.error || 'Email failed. Please try again.', 2000);
          }
        })
        .catch(() => { dismiss(); showToast('error', 'Email failed. Please try again.', 2000); });
    },
    [showToast]
  );

  const handleDownloadLast = useCallback(() => {
    if (!state.lastSources.length) return;
    const s = state.lastSources[0];
    handleDownload({ doc_id: s.doc_id, filename: s.title, file_url: s.file_url });
  }, [state.lastSources, handleDownload]);

  const handleClear = useCallback(() => {
    if (settings.confirmBeforeClear) {
      if (!window.confirm('Clear the conversation? This cannot be undone.')) return;
    }
    clear();
    setTimeout(() => initWelcome(), 0);
  }, [clear, initWelcome, settings.confirmBeforeClear]);

  const hasUserMessages = state.messages.some(m => m.role === 'user');
  const hasResponded = state.messages.filter(m => m.role === 'assistant').length >= 1;

  return (
    <>
      <BackgroundLayer />
      <DropVeil visible={dragOver} />
      <ToastHost toasts={toasts} onDismiss={dismissToast} />

      <div className="enterprise-shell">
        {/* ── Top Bar ── */}
        <TopBar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
          messageCount={messageCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* ── Body ── */}
        <div className="enterprise-body">
          {/* ── Left Sidebar (icon rail + main panel) ── */}
          <LeftSidebarEnterprise
            open={sidebarOpen}
            downloadHistory={dlHistory}
            onClearChat={handleClear}
            onDownloadLast={handleDownloadLast}
            lastSources={state.lastSources}
            onDownload={handleDownload}
            activePage={currentPage}
            onNavigate={(page) => {
              if (page === 'home' || page === 'chat' || page === 'settings')
                setCurrentPage(page as 'home' | 'chat' | 'settings');
            }}
            onToggleSidebar={() => setSidebarOpen(o => !o)}
            sidebarOpen={sidebarOpen}
          />

          {/* ── Home Dashboard ── */}
          {currentPage === 'home' && <HomeDashboard />}

          {/* ── Settings Page ── */}
          {currentPage === 'settings' && <SettingsPage />}

          {/* ── Chat Workspace ── */}
          {currentPage === 'chat' && (
          <section className="chat-workspace">
            <ChatThread
              messages={state.messages}
              isTyping={state.isTyping}
              onDownload={handleDownload}
              onEmailFirstSource={handleEmailFirstSource}
              onEmailDelivery={handleEmailDelivery}
              onSend={send}
              searchQuery={searchQuery}
              conversationTitle={conversationTitle}
            />
            <Composer ref={composerRef} onSend={send} disabled={state.isTyping} />
          </section>
          )}

          {/* ── Right Panel: Context & Sources + Contextual Actions ── */}
          {currentPage === 'chat' && (
          <aside className="right-panel-aside">
            <RightPanelContextSources
              meta={state.lastMeta}
              hasResponded={hasResponded}
              lastSources={state.lastSources}
              onDownload={handleDownload}
              messages={state.messages}
              onShowToast={showToast}
              onFillPrompt={(text) => composerRef.current?.setValue(text)}
            />
          </aside>
          )}
        </div>
      </div>
    </>
  );
}
