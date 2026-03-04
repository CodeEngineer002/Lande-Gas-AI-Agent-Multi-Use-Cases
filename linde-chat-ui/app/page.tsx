"use client";
import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import BackgroundLayer from "@/components/BackgroundLayer";
import TopBar from "@/components/TopBar";
import LeftSidebarEnterprise from "@/components/LeftSidebarEnterprise";
import ChatThread from "@/components/ChatThread";
import Composer from "@/components/Composer";
import type { ComposerHandle } from "@/components/Composer";
import SuggestionChips from "@/components/SuggestionChips";
import ToastHost from "@/components/ToastHost";
import DropVeil from "@/components/DropVeil";
import RightPanelContextSources from "@/components/RightPanelContextSources";
import { useChat } from "@/hooks/useChat";
import { useDownload } from "@/hooks/useDownload";
import { useDownloadHistory } from "@/hooks/useDownloadHistory";
import { useToast } from "@/hooks/useToast";
import type { ChatMessage, DownloadPayload } from "@/lib/types";

export default function Page() {
  const { state, send, clear, initWelcome } = useChat();
  const { toasts, showToast, dismissToast } = useToast();
  const { history: dlHistory, push: pushDlHistory } = useDownloadHistory();
  const [dragOver, setDragOver] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
      initWelcome();
    }
  }, [initWelcome]);

  // Re-focus the composer whenever the AI finishes responding (isTyping goes false)
  const prevIsTyping = useRef(false);
  useEffect(() => {
    if (prevIsTyping.current && !state.isTyping) {
      // Small tick so the DOM fully settles before focusing
      const id = setTimeout(() => composerRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
    prevIsTyping.current = state.isTyping;
  }, [state.isTyping]);

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

  const { start: startDownload } = useDownload({
    onSuccess: (title, docId) => {
      showToast('success', 'Successfully downloaded', 1400);
      pushDlHistory({ title, doc_id: docId });
    },
    onError: (msg) => showToast('error', msg, 1800),
    onEmailSuccess: () => {
      showToast('success', 'Email sent successfully', 1400);
    },
  });

  const handleDownload = useCallback(
    (payload: DownloadPayload) => { showToast('info', 'Downloading the PDF now…', 0); startDownload(payload); },
    [startDownload, showToast]
  );

  const handleEmailFirstSource = useCallback(
    (sources: ChatMessage['sources']) => {
      if (!sources.length) { showToast('error', 'No document to email.', 1600); return; }
      const s = sources[0];
      const lastEmail = typeof window !== 'undefined' ? localStorage.getItem('linde_last_email') || '' : '';
      const addr = window.prompt('Enter recipient email:', lastEmail);
      if (!addr) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) { showToast('error', 'Invalid email address.', 1600); return; }
      localStorage.setItem('linde_last_email', addr);
      showToast('info', 'Sending email…', 0);
      startDownload({ doc_id: s.doc_id, filename: s.title, file_url: s.file_url, email: addr });
    },
    [startDownload, showToast]
  );

  const handleDownloadLast = useCallback(() => {
    if (!state.lastSources.length) return;
    const s = state.lastSources[0];
    handleDownload({ doc_id: s.doc_id, filename: s.title, file_url: s.file_url });
  }, [state.lastSources, handleDownload]);

  const handleClear = useCallback(() => { clear(); setTimeout(() => initWelcome(), 0); }, [clear, initWelcome]);

  const hasUserMessages = state.messages.some(m => m.role === 'user');
  const hasResponded = state.messages.filter(m => m.role === 'assistant').length > 1;

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
          />

          {/* ── Chat Workspace ── */}
          <section className="chat-workspace">
            <ChatThread
              messages={state.messages}
              isTyping={state.isTyping}
              onDownload={handleDownload}
              onEmailFirstSource={handleEmailFirstSource}
              onSend={send}
              searchQuery={searchQuery}
              conversationTitle={conversationTitle}
            />
            <SuggestionChips visible={!hasUserMessages} onSelect={(text: string) => send(text)} />
            <Composer ref={composerRef} onSend={send} disabled={state.isTyping} />
          </section>

          {/* ── Right Panel: Context & Sources + Contextual Actions ── */}
          <aside className="right-panel-aside">
            <RightPanelContextSources
              meta={state.lastMeta}
              hasResponded={hasResponded}
              lastSources={state.lastSources}
              onDownload={handleDownload}
              messages={state.messages}
              onShowToast={showToast}
            />
          </aside>
        </div>
      </div>
    </>
  );
}
