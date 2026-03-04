"use client";
import { useEffect, useCallback, useRef, useState } from "react";
import BackgroundLayer from "@/components/BackgroundLayer";
import Header from "@/components/Header";
import LeftPanel from "@/components/LeftPanel";
import ChatThread from "@/components/ChatThread";
import Composer from "@/components/Composer";
import SuggestionChips from "@/components/SuggestionChips";
import ToastHost from "@/components/ToastHost";
import DropVeil from "@/components/DropVeil";
import AITransparencyCard from "@/components/AITransparencyCard";
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
  const dragCountRef = useRef(0);
  const hasWelcome = useRef(false);
  const messageCount = state.messages.filter(m => m.role === 'user').length;

  useEffect(() => {
    if (!hasWelcome.current) {
      hasWelcome.current = true;
      initWelcome();
    }
  }, [initWelcome]);

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
    (payload: DownloadPayload) => { showToast('info', 'Downloading the PDF now\u2026', 0); startDownload(payload); },
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
      showToast('info', 'Sending email\u2026', 0);
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
  // hasResponded = at least one real AI reply (not just the welcome message)
  const hasResponded = state.messages.filter(m => m.role === 'assistant').length > 1;

  return (
    <>
      <BackgroundLayer />
      <DropVeil visible={dragOver} />
      <ToastHost toasts={toasts} onDismiss={dismissToast} />

      <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', color:'var(--ink)' }}>
        <Header
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
          messageCount={messageCount}
        />
        <div style={{ flex:1, minHeight:0, display:'flex', gap:12, padding:'10px 14px', overflow:'hidden' }}>
          <div style={{ flex:'0 0 20%', minWidth:0, overflow:'hidden' }}>
            <LeftPanel
              open={sidebarOpen}
              downloadHistory={dlHistory}
              onClearChat={handleClear}
              onDownloadLast={handleDownloadLast}
              lastSources={state.lastSources}
              onDownload={handleDownload}
            />
          </div>
          <section style={{ display:'flex', flexDirection:'column', flex:'0 0 55%', minWidth:0, overflow:'hidden' }}>
            <ChatThread
              messages={state.messages}
              isTyping={state.isTyping}
              onDownload={handleDownload}
              onEmailFirstSource={handleEmailFirstSource}
            />
            <SuggestionChips visible={!hasUserMessages} onSelect={(text: string) => send(text)} />
            <Composer onSend={send} disabled={state.isTyping} />
          </section>
          <aside style={{ display:'flex', flexDirection:'column', flex:'0 0 25%', minWidth:0, padding:'20px', borderRadius:'16px', background:'var(--assist)', border:'1px solid var(--assistBorder)', boxShadow:'var(--shadow-sm)', gap:'16px' }}>
            <h3 style={{ margin:'0', fontSize:'17px', fontWeight:'700', color:'var(--ink)' }}>Additional Features</h3>
            <AITransparencyCard meta={state.lastMeta} hasResponded={hasResponded} />
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:'13px', textAlign:'center', padding:'20px 16px', opacity:0.6 }}>
              More features coming soon...
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
