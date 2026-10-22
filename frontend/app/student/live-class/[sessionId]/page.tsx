"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Send, Radio, Users, Code, FileText, MessageSquare,
  Loader2, AlertCircle, LogOut, Star, Hand, Volume2,
  VolumeX, Maximize, Maximize2, Sparkles, Layout,
  HelpCircle, CheckCircle2
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
  const [handRaised, setHandRaised] = useState(false);
  const [handRaisedSuccess, setHandRaisedSuccess] = useState(false);

  // Video Stage State
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(85);
  const [videoLayout, setVideoLayout] = useState<"split" | "pip" | "theater">("split");
  const [audioPulse, setAudioPulse] = useState(60);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Audio wave pulse animation for teacher speaking
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMuted) {
        setAudioPulse(Math.floor(40 + Math.random() * 45));
      } else {
        setAudioPulse(0);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isMuted]);

  // Animated Teacher Live Broadcast Stage (HTML5 Canvas stream)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      ctx.fillStyle = "#0a0f1d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Studio ambient grid
      ctx.strokeStyle = "rgba(99, 102, 241, 0.07)";
      ctx.lineWidth = 1;
      const step = 28;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Teacher Avatar Spotlight
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const glow = Math.sin(frame * 0.04) * 10;

      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 150 + glow);
      grad.addColorStop(0, "rgba(99, 102, 241, 0.3)");
      grad.addColorStop(0.5, "rgba(79, 70, 229, 0.12)");
      grad.addColorStop(1, "rgba(10, 15, 29, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 150 + glow, 0, Math.PI * 2);
      ctx.fill();

      // Teacher portrait frame
      ctx.fillStyle = "#1e1b4b";
      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Emoji teacher
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👨‍🏫", cx, cy - 8);

      // Live Audio Equalizer at bottom of teacher video
      const waveY = canvas.height - 30;
      ctx.strokeStyle = isMuted ? "#475569" : "#60a5fa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i += 6) {
        const h = !isMuted ? Math.sin((i + frame * 3.5) * 0.07) * (audioPulse * 0.22) : 0;
        if (i === 0) ctx.moveTo(i, waveY + h);
        else ctx.lineTo(i, waveY + h);
      }
      ctx.stroke();

      // Top stream header
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(28, 24, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("LIVE TEACHER BROADCAST • 1080p 60fps", 40, 27);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isMuted, audioPulse]);

  // Flash on slide change
  useEffect(() => {
    if (session && lastSlide.current !== -1 && session.current_slide !== lastSlide.current) {
      // Slide updated
    }
    if (session) lastSlide.current = session.current_slide;
  }, [session]);

  const sendMessage = async (overrideText?: string, isQ: boolean = false) => {
    const text = (overrideText || newMsg).trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await (api as any).postLiveChatMessage(sessionId, text, isQ || isQuestion);
      setMessages(prev => [...prev, msg]);
      if (!overrideText) setNewMsg("");
      setIsQuestion(false);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
    setSending(false);
  };

  const handleRaiseHand = async () => {
    setHandRaised(true);
    setHandRaisedSuccess(true);
    await sendMessage("✋ [Hand Raised] I have a question about this slide!", true);
    setTimeout(() => setHandRaisedSuccess(false), 3500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <p className="text-slate-300 text-sm">Connecting to Live Video Classroom...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-slate-300">Class session not found or has concluded</p>
          <Button onClick={() => router.push("/student/classes")} variant="outline" className="text-white border-slate-700">
            Back to Classes
          </Button>
        </div>
      </div>
    );
  }

  const slides = session.materials_json || [];
  const currentSlide = slides[session.current_slide] || {};
  const totalSlides = slides.length;
  const isEnded = session.status === "ended";

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden z-50 text-slate-100">
      {/* Top Classroom Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          {isEnded ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold text-slate-300">
              Session Concluded
            </span>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/25 border border-red-500/40 rounded-full">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="text-xs font-bold text-red-300 tracking-wider">LIVE CLASS</span>
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              {session.title}
            </h1>
            <p className="text-xs text-slate-400">
              {session.class_name} • Instructor: {session.teacher_name || "Faculty Member"}
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-3">
          {/* Layout buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setVideoLayout("split")}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${videoLayout === "split" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
            >
              Split View
            </button>
            <button
              onClick={() => setVideoLayout("pip")}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${videoLayout === "pip" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
            >
              PiP Video
            </button>
            <button
              onClick={() => setVideoLayout("theater")}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${videoLayout === "theater" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
            >
              Theater
            </button>
          </div>

          <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            {session.active_attendees_count || 1} watching
          </span>

          <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
            Slide {session.current_slide + 1}/{totalSlides}
          </span>

          <Button
            onClick={() => router.push("/student/classes")}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave Class
          </Button>
        </div>
      </div>

      {/* Ended / Completion banner */}
      {isEnded && (
        <div className="bg-emerald-950/60 border-b border-emerald-800/40 px-4 py-2 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <p className="text-emerald-300 text-xs font-semibold">
            🎓 Live lecture completed! You earned +50 XP for live attendance. Slides are available below for review.
          </p>
        </div>
      )}

      {/* Main Classroom: Video Stage + Slides + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Stage Container */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">

          {/* VIEW MODE 1: Split View (Live Video + Slide) */}
          {videoLayout === "split" && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 overflow-hidden">
              {/* Teacher Live Video Player (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col gap-3 min-h-[280px]">
                <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative shadow-xl flex flex-col">
                  {/* Canvas Video Stream */}
                  <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={360}
                      className="w-full h-full object-cover"
                    />

                    {/* Stream Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600/90 text-white text-[10px] font-bold rounded-md">
                        <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE STREAM
                      </div>
                      <span className="text-[10px] bg-slate-900/80 backdrop-blur-xs text-indigo-300 px-2 py-0.5 rounded-md font-semibold border border-slate-700">
                        Instructor Video
                      </span>
                    </div>

                    {/* Instructor nametag */}
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        {session.teacher_name || "Instructor Alan Turing"}
                      </span>
                    </div>
                  </div>

                  {/* Student Audio / Interaction Bar */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                    {/* Audio Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-1.5 rounded-lg border text-xs transition ${isMuted ? "bg-red-500/20 border-red-500/40 text-red-300" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"}`}
                        title={isMuted ? "Unmute Live Audio" : "Mute Live Audio"}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          setVolume(Number(e.target.value));
                          if (isMuted) setIsMuted(false);
                        }}
                        className="w-20 accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Raise Hand Button */}
                    <Button
                      onClick={handleRaiseHand}
                      size="sm"
                      className={`h-8 px-3 text-xs gap-1.5 rounded-xl font-bold transition shadow-sm ${handRaisedSuccess ? "bg-emerald-600 text-white" : "bg-amber-600 hover:bg-amber-500 text-white"}`}
                    >
                      <Hand className="w-3.5 h-3.5" />
                      {handRaisedSuccess ? "Hand Raised! ✓" : "Raise Hand ✋"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lecture Slides View (7 cols on lg) */}
              <div className="lg:col-span-7 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                {/* Slide Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      SLIDE {session.current_slide + 1} OF {totalSlides} • SYNCHRONIZED
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">{currentSlide.title || "Lecture Material"}</h2>
                  </div>
                  <div className="flex gap-1.5">
                    {slides.map((_: any, idx: number) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${idx === session.current_slide ? "bg-indigo-500 w-5" : "bg-slate-700 w-2"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Slide Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {currentSlide.content && (
                    <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-300 uppercase">Live Lecture Content</span>
                      </div>
                      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{currentSlide.content}</p>
                    </div>
                  )}

                  {currentSlide.code_snippet && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-700/80">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300 uppercase">Interactive Code Sample</span>
                      </div>
                      <pre className="text-emerald-300 text-xs overflow-x-auto leading-relaxed font-mono">
                        {currentSlide.code_snippet}
                      </pre>
                    </div>
                  )}

                  <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-800/30 flex items-center gap-2 text-xs text-indigo-300">
                    <Star className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                    <span>This slide is auto-synced to your instructor's presentation in real time.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Picture-in-Picture (Slide full, floating teacher video) */}
          {videoLayout === "pip" && (
            <div className="flex-1 relative flex flex-col p-4 overflow-hidden">
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-indigo-400">SLIDE {session.current_slide + 1} OF {totalSlides}</span>
                  <h2 className="text-2xl font-black text-white mt-1">{currentSlide.title}</h2>
                </div>
                {currentSlide.content && (
                  <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700">
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{currentSlide.content}</p>
                  </div>
                )}
                {currentSlide.code_snippet && (
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-700">
                    <pre className="text-emerald-300 text-sm font-mono overflow-x-auto">{currentSlide.code_snippet}</pre>
                  </div>
                )}
              </div>

              {/* Floating Teacher Cam PiP */}
              <div className="absolute bottom-6 right-6 w-72 h-44 bg-slate-900 rounded-2xl border-2 border-indigo-500 shadow-2xl overflow-hidden flex flex-col z-20">
                <div className="flex-1 relative bg-black">
                  <canvas ref={canvasRef} width={288} height={160} className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    LIVE
                  </div>
                </div>
                <div className="p-1.5 bg-slate-900 flex justify-between items-center px-3">
                  <span className="text-[10px] text-slate-300 font-bold">{session.teacher_name}</span>
                  <Button onClick={handleRaiseHand} size="sm" className="h-6 text-[10px] px-2 bg-amber-600 hover:bg-amber-500 text-white">
                    Raise Hand ✋
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: Theater Mode */}
          {videoLayout === "theater" && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 bg-black rounded-2xl border border-slate-800 relative overflow-hidden shadow-2xl flex items-center justify-center">
                <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-contain" />
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">Instructor Broadcast • Full Theater</span>
                </div>
              </div>

              <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <span className="text-xs text-slate-300">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-24 accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
                <Button onClick={handleRaiseHand} size="sm" className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">
                  <Hand className="w-3.5 h-3.5 mr-1" /> Raise Hand
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Live Q&A Chat Panel */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800 flex items-center gap-2 shrink-0">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Class Chat & Questions</span>
            <span className="ml-auto text-xs text-slate-400">{messages.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No messages yet. Ask a question or say hi to your classmates!</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${msg.user_role === "teacher" ? "text-indigo-300" : "text-slate-400"}`}>
                      {msg.user_role === "teacher" ? "👨‍🏫 " + (msg.user_name || "Teacher") : msg.user_name}
                    </span>
                    {msg.is_question && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                        QUESTION
                      </span>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${msg.user_role === "teacher" ? "bg-indigo-900/60 text-indigo-100 border border-indigo-700/40" : "bg-slate-800 text-slate-200 border border-slate-700"}`}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Question Prompts */}
          {!isEnded && (
            <div className="p-2 border-t border-slate-800 bg-slate-900/90 flex gap-1.5 overflow-x-auto text-[11px] shrink-0">
              <button
                onClick={() => sendMessage("Can you explain the time complexity again?", true)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition cursor-pointer"
              >
                ❓ Complexity?
              </button>
              <button
                onClick={() => sendMessage("Could you walk through a concrete code example?", true)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition cursor-pointer"
              >
                💡 Code example?
              </button>
            </div>
          )}

          {/* Chat Input */}
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
                  placeholder={isQuestion ? "Ask your question..." : "Send a message..."}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Button onClick={() => sendMessage()} disabled={sending || !newMsg.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 h-auto py-2 font-bold">
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
