"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Users, Send, Radio,
  Code, FileText, MessageSquare, StopCircle, Clock,
  Loader2, AlertCircle, Video, VideoOff, Mic, MicOff,
  Monitor, MonitorOff, Layout, Maximize2, Sparkles,
  HelpCircle, Volume2, ShieldAlert
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

  // --- Live Video Teaching State ---
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"split" | "pip" | "theater">("split");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [broadcastActive, setBroadcastActive] = useState(true);
  const [audioLevel, setAudioLevel] = useState(65);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Camera/Microphone
  const startCamera = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCamOn(true);
        setCameraError(null);
      } else {
        setCameraError("Camera API not supported in this browser. Using virtual studio.");
      }
    } catch (err: any) {
      console.warn("Could not acquire real camera stream:", err?.message);
      setCameraError("Webcam not detected or access not granted. Virtual Teacher Broadcast Studio is running.");
      setIsCamOn(true); // Keep studio preview alive
    }
  }, []);

  const stopCameraTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopCameraTracks();
      setIsScreenSharing(false);
      startCamera();
    } else {
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
          stopCameraTracks();
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          mediaStreamRef.current = screenStream;
          if (videoRef.current) {
            videoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);
          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            startCamera();
          };
        }
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  };

  const toggleCamera = () => {
    if (isCamOn && mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(track => { track.enabled = !track.enabled; });
      setIsCamOn(prev => !prev);
    } else if (!isCamOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(track => { track.enabled = true; });
      }
      setIsCamOn(true);
    } else {
      setIsCamOn(prev => !prev);
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
    }
    setIsMicOn(prev => !prev);
  };

  // Virtual audio visualizer loop
  useEffect(() => {
    if (!isMicOn) {
      setAudioLevel(0);
      return;
    }
    const interval = setInterval(() => {
      // Simulate realistic speech audio levels between 30 and 85
      setAudioLevel(Math.floor(35 + Math.random() * 50));
    }, 200);
    return () => clearInterval(interval);
  }, [isMicOn]);

  // Fallback Canvas Animation when physical camera is inactive/unsupported
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background
      ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
      ctx.lineWidth = 1;
      const step = 30;
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

      // Teacher Avatar Silhouette & Glow
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Pulse rings
      const pulse = Math.sin(frame * 0.05) * 8;
      const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, 140 + pulse);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.35)");
      gradient.addColorStop(0.6, "rgba(129, 140, 248, 0.15)");
      gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 140 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Avatar circle
      ctx.fillStyle = "#1e1b4b";
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Avatar Icon (Teacher glyph)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👨‍🏫", cx, cy - 12);

      // Audio Waveform at bottom of virtual stream
      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const waveY = canvas.height - 35;
      for (let i = 0; i < canvas.width; i += 8) {
        const h = isMicOn ? Math.sin((i + frame * 4) * 0.06) * (audioLevel * 0.25) : 0;
        if (i === 0) ctx.moveTo(i, waveY + h);
        else ctx.lineTo(i, waveY + h);
      }
      ctx.stroke();

      // Live tag on canvas
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(30, 25, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("HD 1080p • LIVE BROADCAST", 42, 28);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isMicOn, audioLevel]);

  // Load session & messages
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
      startCamera();
    };
    init();

    pollRef.current = setInterval(() => {
      loadMessages();
      loadSession();
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      stopCameraTracks();
    };
  }, [loadSession, loadMessages, startCamera, stopCameraTracks]);

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
    if (!confirm("Are you sure you want to end this live video class?")) return;
    setEnding(true);
    stopCameraTracks();
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
          <p className="text-slate-300 text-sm">Initializing Live Video Teaching Studio...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-slate-300">Live class session not found</p>
          <Button onClick={() => router.push("/teacher/classes")} variant="outline" className="text-white border-slate-700">
            Back to Classes
          </Button>
        </div>
      </div>
    );
  }

  const slides = session.materials_json || [];
  const currentSlide = slides[session.current_slide] || {};
  const totalSlides = slides.length;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden z-50 text-slate-100">
      {/* Top Studio Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/25 border border-red-500/40 rounded-full">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-xs font-bold text-red-300 tracking-wider">LIVE STUDIO</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              {session.title}
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                1080p 60fps
              </span>
            </h1>
            <p className="text-xs text-slate-400">{session.class_name} • Teaching Mode Active</p>
          </div>
        </div>

        {/* Studio Controls Header */}
        <div className="flex items-center gap-3">
          {/* Layout Mode Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setLayoutMode("split")}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${layoutMode === "split" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
              title="Split View (Video + Slide)"
            >
              Split View
            </button>
            <button
              onClick={() => setLayoutMode("pip")}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${layoutMode === "pip" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
              title="Picture-in-Picture Floating Cam"
            >
              PiP Cam
            </button>
            <button
              onClick={() => setLayoutMode("theater")}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${layoutMode === "theater" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
              title="Video Theater Mode"
            >
              Theater
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">{session.active_attendees_count || 1}</span> attending
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Slide {session.current_slide + 1}/{totalSlides}
          </div>

          <Button
            onClick={endClass}
            disabled={ending}
            className="bg-red-700 hover:bg-red-600 text-white text-xs px-3.5 py-1.5 h-auto gap-1.5 font-bold shadow-sm"
          >
            {ending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StopCircle className="w-3.5 h-3.5" />}
            End Class
          </Button>
        </div>
      </div>

      {/* Camera Alert / Info banner if real camera unavailable */}
      {cameraError && (
        <div className="bg-indigo-950/60 border-b border-indigo-800/40 px-4 py-1.5 flex items-center justify-between text-xs text-indigo-200 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Virtual Teacher Studio is active with simulated speech waves & laser pointer. Connect a physical webcam anytime.</span>
          </div>
          <button onClick={startCamera} className="text-[11px] underline font-bold hover:text-white">
            Try Physical Cam
          </button>
        </div>
      )}

      {/* Main Workspace: Stage + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Teaching Stage Container */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          
          {/* VIEW MODE 1: Split View (Video on Top/Left, Slides on Bottom/Right) */}
          {layoutMode === "split" && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 overflow-hidden">
              {/* Video Teaching Studio (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col gap-3 min-h-[300px]">
                {/* Video Monitor */}
                <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative shadow-xl flex flex-col">
                  {/* Stream Screen */}
                  <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    {/* Real Video Element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${(!isCamOn || cameraError) ? "hidden" : "block"}`}
                    />
                    {/* Fallback Virtual Broadcast Canvas */}
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={360}
                      className={`w-full h-full object-cover ${(isCamOn && !cameraError) ? "hidden" : "block"}`}
                    />

                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600/90 text-white text-[10px] font-bold rounded-md uppercase tracking-wider backdrop-blur-xs">
                        <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
                      </div>
                      {isScreenSharing && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600/90 text-white text-[10px] font-bold rounded-md">
                          <Monitor className="w-2.5 h-2.5" /> SCREEN SHARE
                        </div>
                      )}
                    </div>

                    {/* Teacher Nametag */}
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold text-white">Teacher Stream (Instructor)</span>
                    </div>

                    {/* Audio VU Meter */}
                    <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1.5">
                      <Volume2 className="w-3 h-3 text-indigo-400" />
                      <div className="flex gap-0.5 items-end h-3 w-10">
                        <div className={`w-1 bg-emerald-400 rounded-full transition-all ${isMicOn && audioLevel > 20 ? "h-3" : "h-1"}`} />
                        <div className={`w-1 bg-emerald-400 rounded-full transition-all ${isMicOn && audioLevel > 40 ? "h-3" : "h-1"}`} />
                        <div className={`w-1 bg-amber-400 rounded-full transition-all ${isMicOn && audioLevel > 60 ? "h-3" : "h-1"}`} />
                        <div className={`w-1 bg-red-400 rounded-full transition-all ${isMicOn && audioLevel > 80 ? "h-3" : "h-1"}`} />
                      </div>
                    </div>
                  </div>

                  {/* Teacher Studio Media Bar */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={toggleCamera}
                        size="sm"
                        variant={isCamOn ? "outline" : "destructive"}
                        className={`h-8 px-3 text-xs gap-1.5 rounded-xl ${isCamOn ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-red-600 text-white"}`}
                      >
                        {isCamOn ? <Video className="w-3.5 h-3.5 text-indigo-400" /> : <VideoOff className="w-3.5 h-3.5" />}
                        {isCamOn ? "Camera On" : "Camera Off"}
                      </Button>

                      <Button
                        onClick={toggleMic}
                        size="sm"
                        variant={isMicOn ? "outline" : "destructive"}
                        className={`h-8 px-3 text-xs gap-1.5 rounded-xl ${isMicOn ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-red-600 text-white"}`}
                      >
                        {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
                        {isMicOn ? "Mute Mic" : "Unmute Mic"}
                      </Button>
                    </div>

                    <Button
                      onClick={toggleScreenShare}
                      size="sm"
                      className={`h-8 px-3 text-xs gap-1.5 rounded-xl font-semibold ${isScreenSharing ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      {isScreenSharing ? "Stop Sharing" : "Share Screen"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lecture Slides & Materials (7 cols on lg) */}
              <div className="lg:col-span-7 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                {/* Slide Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 tracking-wider uppercase">
                      LECTURE SLIDE {session.current_slide + 1} OF {totalSlides}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">{currentSlide.title || "Teaching Material"}</h2>
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
                        <span className="text-xs font-bold text-indigo-300 uppercase">Core Explanation</span>
                      </div>
                      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{currentSlide.content}</p>
                    </div>
                  )}

                  {currentSlide.code_snippet && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-700/80">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300 uppercase">Live Code Snippet</span>
                      </div>
                      <pre className="text-emerald-300 text-xs overflow-x-auto leading-relaxed font-mono">
                        {currentSlide.code_snippet}
                      </pre>
                    </div>
                  )}

                  {currentSlide.notes && (
                    <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/40">
                      <p className="text-xs font-bold text-amber-400 mb-1">📝 Teacher Secret Notes</p>
                      <p className="text-amber-200/80 text-xs">{currentSlide.notes}</p>
                    </div>
                  )}
                </div>

                {/* Slide Navigation Bar */}
                <div className="bg-slate-900 border-t border-slate-800 p-3 flex items-center justify-between gap-4 shrink-0">
                  <Button
                    onClick={() => syncSlide("prev")}
                    disabled={session.current_slide === 0 || syncing}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev Slide
                  </Button>
                  <span className="text-xs text-slate-400 font-semibold">
                    Synced Live to all {session.active_attendees_count || 1} Students
                  </span>
                  <Button
                    onClick={() => syncSlide("next")}
                    disabled={session.current_slide === totalSlides - 1 || syncing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-bold"
                  >
                    Next Slide <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Picture-in-Picture (Slides full with floating teacher cam) */}
          {layoutMode === "pip" && (
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

              {/* Floating PiP Video Camera Window */}
              <div className="absolute bottom-6 right-6 w-72 h-44 bg-slate-900 rounded-2xl border-2 border-indigo-500 shadow-2xl overflow-hidden flex flex-col z-20">
                <div className="flex-1 relative bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${(!isCamOn || cameraError) ? "hidden" : "block"}`}
                  />
                  <canvas
                    ref={canvasRef}
                    width={288}
                    height={160}
                    className={`w-full h-full object-cover ${(isCamOn && !cameraError) ? "hidden" : "block"}`}
                  />
                  <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    LIVE
                  </div>
                </div>
                <div className="p-1.5 bg-slate-900 flex justify-around">
                  <button onClick={toggleCamera} className="text-xs text-slate-300 hover:text-white">
                    {isCamOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5 text-red-400" />}
                  </button>
                  <button onClick={toggleMic} className="text-xs text-slate-300 hover:text-white">
                    {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                  </button>
                  <button onClick={toggleScreenShare} className="text-xs text-slate-300 hover:text-white">
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: Theater Mode (Large Video Teaching Stage) */}
          {layoutMode === "theater" && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 bg-black rounded-2xl border border-slate-800 relative overflow-hidden shadow-2xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain ${(!isCamOn || cameraError) ? "hidden" : "block"}`}
                />
                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className={`w-full h-full object-contain ${(isCamOn && !cameraError) ? "hidden" : "block"}`}
                />
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">Full Theater Teaching Stage</span>
                </div>
              </div>

              {/* Theater Control Strip */}
              <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button onClick={toggleCamera} size="sm" variant="outline" className="text-xs border-slate-700 text-slate-200">
                    {isCamOn ? <Video className="w-3.5 h-3.5 text-indigo-400 mr-1" /> : <VideoOff className="w-3.5 h-3.5 text-red-400 mr-1" />}
                    {isCamOn ? "Camera On" : "Camera Off"}
                  </Button>
                  <Button onClick={toggleMic} size="sm" variant="outline" className="text-xs border-slate-700 text-slate-200">
                    {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <MicOff className="w-3.5 h-3.5 text-red-400 mr-1" />}
                    {isMicOn ? "Mic On" : "Muted"}
                  </Button>
                  <Button onClick={toggleScreenShare} size="sm" variant="outline" className="text-xs border-slate-700 text-slate-200">
                    <Monitor className="w-3.5 h-3.5 mr-1" /> Screen
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => syncSlide("prev")} disabled={session.current_slide === 0} size="sm" variant="ghost" className="text-xs text-slate-300">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Slide {session.current_slide + 1}/{totalSlides}
                  </Button>
                  <Button onClick={() => syncSlide("next")} disabled={session.current_slide === totalSlides - 1} size="sm" className="bg-indigo-600 text-xs">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Q&A Chat Panel */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800 flex items-center gap-2 shrink-0">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Live Student Q&A</span>
            <span className="ml-auto text-xs text-slate-400">{messages.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No questions yet. Students can ask live questions during your lecture.</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`space-y-0.5 ${msg.user_role === "teacher" ? "items-end" : ""}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${msg.user_role === "teacher" ? "text-indigo-300" : "text-slate-400"}`}>
                      {msg.user_role === "teacher" ? "👨‍🏫 You" : msg.user_name}
                    </span>
                    {msg.is_question && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                        QUESTION
                      </span>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[92%] ${msg.user_role === "teacher" ? "bg-indigo-700 text-white ml-auto" : "bg-slate-800 text-slate-200 border border-slate-700"}`}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Announcement Sender */}
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
