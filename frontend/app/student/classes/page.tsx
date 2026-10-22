"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Users, BookOpen, ArrowRight, User,
  Hash, Plus, Video, Radio, X, Loader2, AlertCircle,
  RefreshCw, CheckCircle2, ClipboardList
} from "lucide-react";

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Attending a live session
  const [attendingId, setAttendingId] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLiveSessions = useCallback(async () => {
    setLiveLoading(true);
    try {
      const sessions = await (api as any).getActiveLiveClasses();
      setLiveSessions(sessions || []);
    } catch {
      setLiveSessions([]);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
    loadLiveSessions();
    // Poll live sessions every 20s
    const interval = setInterval(loadLiveSessions, 20000);
    return () => clearInterval(interval);
  }, [loadClasses, loadLiveSessions]);

  const joinClass = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError(null);
    setJoinSuccess(null);
    try {
      const joined = await (api as any).joinClassByCode(joinCode.trim().toUpperCase());
      setJoinSuccess(`Successfully joined "${joined.name}"!`);
      setJoinCode("");
      loadClasses();
      setTimeout(() => {
        setJoinSuccess(null);
        setShowJoinModal(false);
      }, 2500);
    } catch (e: any) {
      setJoinError(e?.message || "Invalid class code. Please check with your teacher.");
    } finally {
      setJoining(false);
    }
  };

  const attendLiveClass = async (sessionId: string) => {
    setAttendingId(sessionId);
    try {
      await (api as any).attendLiveClass(sessionId);
      // Navigate to live classroom
      window.location.href = `/student/live-class/${sessionId}`;
    } catch {
      window.location.href = `/student/live-class/${sessionId}`;
    } finally {
      setAttendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" /> My Classes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Your enrolled courses, live sessions, and class resources.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadClasses} variant="outline" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button onClick={() => { setShowJoinModal(true); setJoinError(null); setJoinSuccess(null); setJoinCode(""); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5">
            <Plus className="w-4 h-4" /> Join a Class
          </Button>
        </div>
      </div>

      {/* Active Live Sessions Banner */}
      {!liveLoading && liveSessions.length > 0 && (
        <div className="space-y-3">
          {liveSessions.map(session => (
            <div key={session.id} className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4 text-white flex items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full animate-pulse">🔴 LIVE NOW</span>
                    <span className="text-xs text-red-100">{session.active_attendees_count || 1} student{(session.active_attendees_count || 1) > 1 ? "s" : ""} attending</span>
                  </div>
                  <h3 className="font-bold text-base mt-0.5">{session.title}</h3>
                  <p className="text-xs text-red-100">{session.class_name} • by {session.teacher_name}</p>
                </div>
              </div>
              <Button
                onClick={() => attendLiveClass(session.id)}
                disabled={attendingId === session.id}
                className="bg-white text-red-700 hover:bg-red-50 font-semibold shrink-0 shadow-md"
              >
                {attendingId === session.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Video className="w-4 h-4 mr-1.5" />
                )}
                {attendingId === session.id ? "Joining..." : "Join Live Class"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Classes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : classes.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent>
            <GraduationCap className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-800">No classes yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
              Ask your teacher for the class join code and click "Join a Class" above.
            </p>
            <Button onClick={() => setShowJoinModal(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
              <Hash className="w-4 h-4 mr-1.5" /> Enter Join Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((c) => (
            <Card key={c.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="mastered" className="text-[10px] uppercase font-bold">
                    Enrolled & Active
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">Spring 2026</span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  {c.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {c.description || "AI-powered closed-loop curriculum with Socratic tutoring."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User className="w-4 h-4 text-slate-400" />
                      {c.teacher_name ? `Instructor: ${c.teacher_name}` : "Instructor"}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-4 h-4 text-slate-400" />
                      {c.student_count ?? "?"} Students
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href="/student/dashboard" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" /> My Progress
                    </Button>
                  </Link>
                  <Link href="/student/assessments" className="flex-1">
                    <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                      <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Quizzes <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Join a Class</h2>
              <button onClick={() => setShowJoinModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {joinSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                  <p className="font-semibold text-slate-900">{joinSuccess}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Class Join Code</label>
                    <input
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === "Enter" && joinClass()}
                      placeholder="e.g. CS101A"
                      autoFocus
                      className="mt-1.5 w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg font-mono font-bold text-center focus:outline-none focus:border-indigo-500 tracking-widest"
                    />
                    <p className="text-xs text-slate-400 mt-1.5 text-center">Ask your teacher for the join code</p>
                  </div>
                  {joinError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {joinError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button onClick={() => setShowJoinModal(false)} variant="outline" className="flex-1 text-sm">Cancel</Button>
                    <Button onClick={joinClass} disabled={joining || !joinCode.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
                      {joining ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Hash className="w-4 h-4 mr-1.5" />}
                      {joining ? "Joining..." : "Join Class"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
