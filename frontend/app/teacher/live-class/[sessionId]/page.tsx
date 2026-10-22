"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Users, Send, Radio,
  X, Code, FileText, MessageSquare, StopCircle, Clock,
  Loader2, AlertCircle
} from "lucide-react";

export default function TeacherLiveClassPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [ending, setEnding] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const s = await (api as any).getLiveClass(sessionId);
      setSession(s);
    } catch {}
  }, [sessionId]);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const msgs = await (api as any).getLiveChatMessages(sessionId);
      setMessages(msgs || []);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadSession();
      await loadMessages();
      setLoading(false);
    };
    init();

    // Poll for new messages and attendee count every 3s
    pollRef.current = setInterval(() => {
      loadMessages();
      loadSession();
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadSession, loadMessages]);

  const syncSlide = async (direction: "prev" | "next") => {
    if (!session) return;
    const total = session.materials_json?.length || 1;
    const newSlide = direction === "next"
      ? Math.min(session.current_slide + 1, total - 1)
      : Math.max(session.current_slide - 1, 0);

    setSyncing(true);
    try {
      const updated = await (api as any).syncSlide(sessionId, newSlide);
      setSession(updated);
    } catch {}
    setSyncing(false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      const msg = await (api as any).postLiveChatMessage(sessionId, newMsg.trim(), false);
      setMessages(prev => [...prev, msg]);
      setNewMsg("");
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
    setSending(false);
  };

  const endClass = async () => {
    if (!confirm("End this live class session?")) return;
    setEnding(true);
    try {
      await (api as any).endLiveClass(sessionId);
      router.push("/teacher/classes");
    } catch {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <p className="text-slate-300 text-sm">Loading teaching studio...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-slate-300">Session not found</p>
          <Button onClick={() => router.push("/teacher/classes")} variant="outline">Back to Classes</Button>
        </div>
      </div>
    );
  }

  const slides = session.materials_json || [];
  const currentSlide = slides[session.current_slide] || {};
  const totalSlides = slides.length;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden z-50">
      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/20 border border-red-500/30 rounded-full">
            <Radio className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="text-xs font-bold text-red-300">LIVE</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">{session.title}</h1>
            <p className="text-xs text-slate-400">{session.class_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            {session.active_attendees_count || 1} attendees
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {session.current_slide + 1}/{totalSlides}
          </span>
          <Button onClick={endClass} disabled={ending} className="bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1.5 h-auto gap-1.5">
            {ending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StopCircle className="w-3.5 h-3.5" />}
            End Class
          </Button>
        </div>
      </div>

      {/* Main Layout: Slide + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Presenter */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          {/* Slide Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="max-w-3xl mx-auto">
              {/* Slide title */}
              <div className="mb-4">
                <span className="text-xs text-slate-400 font-medium">SLIDE {session.current_slide + 1} OF {totalSlides}</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">{currentSlide.title || "Untitled Slide"}</h2>
              </div>

              {/* Content */}
              {currentSlide.content && (
                <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Content</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{currentSlide.content}</p>
                </div>
              )}

              {/* Code Snippet */}
              {currentSlide.code_snippet && (
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-700 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Code</span>
                  </div>
                  <pre className="text-emerald-300 text-sm overflow-x-auto leading-relaxed font-mono">
                    {currentSlide.code_snippet}
                  </pre>
                </div>
              )}

              {/* Teacher Notes */}
              {currentSlide.notes && (
                <div className="p-4 bg-amber-950/40 rounded-xl border border-amber-800/30">
                  <p className="text-xs font-bold text-amber-400 mb-1">📝 Teaching Notes (Only visible to you)</p>
                  <p className="text-amber-200/80 text-xs leading-relaxed">{currentSlide.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Slide Navigation */}
          <div className="bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-center gap-4 shrink-0">
            <Button
              onClick={() => syncSlide("prev")}
              disabled={session.current_slide === 0 || syncing}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <div className="flex gap-1.5">
              {slides.map((_: any, idx: number) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${idx === session.current_slide ? "bg-indigo-400 w-4" : "bg-slate-600 hover:bg-slate-500"}`}
                />
              ))}
            </div>
            <Button
              onClick={() => syncSlide("next")}
              disabled={session.current_slide === totalSlides - 1 || syncing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
            {syncing && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
          </div>
        </div>

        {/* Live Chat Panel */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-800 flex items-center gap-2 shrink-0">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Live Q&A Chat</span>
            <span className="ml-auto text-xs text-slate-400">{messages.length} messages</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`space-y-0.5 ${msg.user_role === "teacher" ? "items-end" : ""}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold ${msg.user_role === "teacher" ? "text-indigo-300" : "text-slate-400"}`}>
                    {msg.user_role === "teacher" ? "📡 You" : msg.user_name}
                  </span>
                  {msg.is_question && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">Q</span>}
                </div>
                <div className={`p-2.5 rounded-xl text-xs text-white leading-relaxed max-w-[90%] ${msg.user_role === "teacher" ? "bg-indigo-700 ml-auto" : "bg-slate-700"}`}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-slate-800 shrink-0">
            <div className="flex gap-2">
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Announce to class..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 h-auto py-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
