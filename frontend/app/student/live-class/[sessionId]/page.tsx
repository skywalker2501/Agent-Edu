"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Send, Radio, Users, Code, FileText, MessageSquare,
  Loader2, AlertCircle, LogOut, Star, Hand
} from "lucide-react";

export default function StudentLiveClassPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [isQuestion, setIsQuestion] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastSlide = useRef<number>(-1);

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

    pollRef.current = setInterval(() => {
      loadMessages();
      loadSession();
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadSession, loadMessages]);

  // Show "slide changed" notification
  useEffect(() => {
    if (session && lastSlide.current !== -1 && session.current_slide !== lastSlide.current) {
      // Flash effect handled by CSS transition on slide
    }
    if (session) lastSlide.current = session.current_slide;
  }, [session]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      const msg = await (api as any).postLiveChatMessage(sessionId, newMsg.trim(), isQuestion);
      setMessages(prev => [...prev, msg]);
      setNewMsg("");
      setIsQuestion(false);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <p className="text-slate-300 text-sm">Joining live class...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-slate-300">Session not found or has ended</p>
          <Button onClick={() => router.push("/student/classes")} variant="outline">Back to Classes</Button>
        </div>
      </div>
    );
  }

  const slides = session.materials_json || [];
  const currentSlide = slides[session.current_slide] || {};
  const totalSlides = slides.length;
  const isEnded = session.status === "ended";

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden z-50">
      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          {isEnded ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 border border-slate-600 rounded-full text-xs font-bold text-slate-300">
              Session Ended
            </span>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/20 border border-red-500/30 rounded-full">
              <Radio className="w-3 h-3 text-red-400 animate-pulse" />
              <span className="text-xs font-bold text-red-300">LIVE</span>
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-white">{session.title}</h1>
            <p className="text-xs text-slate-400">{session.class_name} • {session.teacher_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            {session.active_attendees_count || 1} attending
          </span>
          <span className="text-xs text-slate-400">
            Slide {session.current_slide + 1}/{totalSlides}
          </span>
          <Button
            onClick={() => router.push("/student/classes")}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave
          </Button>
        </div>
      </div>

      {isEnded && (
        <div className="bg-amber-900/40 border-b border-amber-800/40 px-4 py-2 text-center">
          <p className="text-amber-300 text-xs font-semibold">
            🎓 This class session has ended. You earned 50 XP for attending! Review the slides below.
          </p>
        </div>
      )}

      {/* Main: Slide View + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide View (auto-synced) */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="mb-4">
              <span className="text-xs text-slate-500 font-medium">SLIDE {session.current_slide + 1} OF {totalSlides}</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">{currentSlide.title || "Loading slide..."}</h2>
              <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1.5">
                <Star className="w-3 h-3" /> Slide is synced live to your teacher's presentation
              </p>
            </div>

            {currentSlide.content && (
              <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Content</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{currentSlide.content}</p>
              </div>
            )}

            {currentSlide.code_snippet && (
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Code Example</span>
                </div>
                <pre className="text-emerald-300 text-sm overflow-x-auto leading-relaxed font-mono">
                  {currentSlide.code_snippet}
                </pre>
              </div>
            )}

            {/* Slide dots indicator */}
            <div className="flex justify-center gap-1.5 pt-4">
              {slides.map((_: any, idx: number) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === session.current_slide ? "bg-indigo-400 w-6" : idx < session.current_slide ? "bg-indigo-700 w-1.5" : "bg-slate-700 w-1.5"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-800 flex items-center gap-2 shrink-0">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Class Chat</span>
            <span className="ml-auto text-xs text-slate-400">{messages.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-slate-500 text-center mt-4">No messages yet. Ask a question!</p>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold ${msg.user_role === "teacher" ? "text-indigo-300" : "text-slate-400"}`}>
                    {msg.user_role === "teacher" ? "👨‍🏫 " + msg.user_name : msg.user_name}
                  </span>
                  {msg.is_question && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">❓</span>}
                </div>
                <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${msg.user_role === "teacher" ? "bg-indigo-900/60 text-indigo-100 border border-indigo-700/40" : "bg-slate-700 text-slate-200"}`}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {!isEnded && (
            <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
              <button
                onClick={() => setIsQuestion(!isQuestion)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition ${isQuestion ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-slate-400 hover:text-slate-300"}`}
              >
                <Hand className="w-3.5 h-3.5" />
                {isQuestion ? "Marked as Question ✓" : "Mark as Question"}
              </button>
              <div className="flex gap-2">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={isQuestion ? "Ask your question..." : "Comment or reply..."}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 h-auto py-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
