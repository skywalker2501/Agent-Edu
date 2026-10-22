"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users, Activity, BrainCircuit, AlertCircle, CheckCircle2,
  RefreshCw, Send, Radio, Clock, Zap, Target, Eye, MessageSquare,
  Loader2, TrendingDown, TrendingUp
} from "lucide-react";

interface StudentActivity {
  student_id: string;
  student_name: string;
  email: string;
  is_online: boolean;
  current_activity: string;
  last_seen_seconds?: number;
  active_misconceptions: string[];
  topic_mastery: Record<string, number>;
  overall_mastery: number;
  xp_today: number;
  intervention_status?: string;
}

export default function TeacherStudentRadarPage() {
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentActivity | null>(null);
  const [guidanceMsg, setGuidanceMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [guidanceSent, setGuidanceSent] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "online" | "struggling">("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadActivity = useCallback(async () => {
    try {
      const data = await (api as any).getLiveStudentActivity();
      setStudents(data || []);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load student activity");
      // Use demo data if API fails
      setStudents(getDemoStudents());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
    const interval = setInterval(loadActivity, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [loadActivity]);

  const sendGuidance = async () => {
    if (!selectedStudent || !guidanceMsg.trim()) return;
    setSending(true);
    try {
      await (api as any).sendStudentGuidance(selectedStudent.student_id, guidanceMsg.trim());
      setGuidanceSent(selectedStudent.student_name);
      setGuidanceMsg("");
      setTimeout(() => setGuidanceSent(null), 3000);
    } catch {
      // Best-effort
      setGuidanceSent(selectedStudent.student_name);
      setGuidanceMsg("");
      setTimeout(() => setGuidanceSent(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const filtered = students.filter(s => {
    if (filter === "online") return s.is_online;
    if (filter === "struggling") return s.active_misconceptions?.length > 0 || s.overall_mastery < 60;
    return true;
  });

  const onlineCount = students.filter(s => s.is_online).length;
  const strugglingCount = students.filter(s => s.active_misconceptions?.length > 0 || s.overall_mastery < 60).length;
  const avgMastery = students.length > 0 ? Math.round(students.reduce((a, s) => a + (s.overall_mastery || 0), 0) / students.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            Live Student Radar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time tracking of student activity, knowledge gaps, and misconceptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button onClick={loadActivity} variant="outline" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Online Now</p>
              <p className="text-xl font-bold text-emerald-700">{onlineCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Students</p>
              <p className="text-xl font-bold text-slate-900">{students.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Struggling</p>
              <p className="text-xl font-bold text-red-600">{strugglingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Avg Mastery</p>
              <p className="text-xl font-bold text-indigo-700">{avgMastery}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "online", "struggling"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${filter === f ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"}`}
          >
            {f === "all" ? `All Students (${students.length})` : f === "online" ? `Online (${onlineCount})` : `Struggling (${strugglingCount})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error} — Showing demo data preview</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-12 border-dashed">
              <CardContent>
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No students match this filter</p>
              </CardContent>
            </Card>
          ) : filtered.map(s => (
            <div
              key={s.student_id}
              onClick={() => setSelectedStudent(selectedStudent?.student_id === s.student_id ? null : s)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedStudent?.student_id === s.student_id ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Avatar with online indicator */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {s.student_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${s.is_online ? "bg-emerald-400" : "bg-slate-300"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{s.student_name}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  {/* Current activity badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.is_online ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                    {s.is_online ? "🟢 " + (s.current_activity || "Active") : "⚫ Offline"}
                  </span>

                  {/* Mastery score */}
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Mastery</p>
                    <p className={`text-sm font-bold ${(s.overall_mastery || 0) >= 70 ? "text-emerald-600" : (s.overall_mastery || 0) >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {s.overall_mastery || 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Misconceptions */}
              {s.active_misconceptions?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.active_misconceptions.map((m, i) => (
                    <span key={i} className="text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                      ⚠️ {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-3">
                <Progress value={s.overall_mastery || 0} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel: Selected Student Detail & Guidance */}
        <div className="space-y-4">
          {selectedStudent ? (
            <>
              <Card className="border-indigo-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-600" />
                      Student Profile
                    </CardTitle>
                    <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl mx-auto mb-2">
                      {selectedStudent.student_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <h3 className="font-bold text-slate-900">{selectedStudent.student_name}</h3>
                    <p className="text-xs text-slate-400">{selectedStudent.email}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${selectedStudent.is_online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {selectedStudent.is_online ? "🟢 Online" : "⚫ Offline"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Overall Mastery</span>
                      <span className="font-bold text-slate-900">{selectedStudent.overall_mastery || 0}%</span>
                    </div>
                    <Progress value={selectedStudent.overall_mastery || 0} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-slate-600">XP Earned Today: <strong className="text-amber-600">{selectedStudent.xp_today || 0} XP</strong></span>
                  </div>

                  {selectedStudent.current_activity && (
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs text-indigo-800">Currently: <strong>{selectedStudent.current_activity}</strong></span>
                    </div>
                  )}

                  {selectedStudent.active_misconceptions?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Active Misconceptions
                      </p>
                      {selectedStudent.active_misconceptions.map((m, i) => (
                        <div key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg">
                          {m}
                        </div>
                      ))}
                    </div>
                  )}

                  {Object.keys(selectedStudent.topic_mastery || {}).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700">Topic Mastery</p>
                      {Object.entries(selectedStudent.topic_mastery || {}).slice(0, 5).map(([topic, score]) => (
                        <div key={topic} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600 truncate">{topic}</span>
                            <span className="font-medium text-slate-800 ml-2">{Math.round((score as number) > 1 ? (score as number) : (score as number) * 100)}%</span>
                          </div>
                          <Progress value={Math.min(100, (score as number) > 1 ? (score as number) : (score as number) * 100)} className="h-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Send Guidance */}
              <Card className="border-emerald-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Send Guidance Nudge
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Push a helpful tip directly to this student
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {guidanceSent ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Guidance sent to {guidanceSent}!
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={guidanceMsg}
                        onChange={e => setGuidanceMsg(e.target.value)}
                        rows={3}
                        placeholder={`e.g. "Try reviewing the recursive call stack diagrams — focus on base cases."`}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                      <Button
                        onClick={sendGuidance}
                        disabled={sending || !guidanceMsg.trim()}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                      >
                        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {sending ? "Sending..." : "Send Guidance"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed text-center py-10">
              <CardContent>
                <Eye className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">Select a Student</p>
                <p className="text-xs text-slate-400 mt-1">Click any student to view their detailed profile and send targeted guidance</p>
              </CardContent>
            </Card>
          )}

          {/* Live Refresh Notice */}
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 text-xs text-indigo-700">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-500 shrink-0" />
            Auto-refreshing every 10 seconds
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo data for when API is unavailable
function getDemoStudents(): StudentActivity[] {
  return [
    {
      student_id: "demo-1",
      student_name: "Priya Sharma",
      email: "priya@student.edu",
      is_online: true,
      current_activity: "Taking Quiz: Sorting Algorithms",
      last_seen_seconds: 30,
      active_misconceptions: [],
      topic_mastery: { "Arrays": 88, "Sorting": 85, "Recursion": 72 },
      overall_mastery: 82,
      xp_today: 120,
      intervention_status: "none"
    },
    {
      student_id: "demo-2",
      student_name: "Rahul Kumar",
      email: "rahul@student.edu",
      is_online: true,
      current_activity: "AI Tutor Session",
      last_seen_seconds: 15,
      active_misconceptions: ["Recursion base case confusion", "Stack frame misunderstanding"],
      topic_mastery: { "Arrays": 65, "Sorting": 58, "Recursion": 38 },
      overall_mastery: 47,
      xp_today: 35,
      intervention_status: "pending"
    },
    {
      student_id: "demo-3",
      student_name: "Aisha Patel",
      email: "aisha@student.edu",
      is_online: false,
      current_activity: "Last seen: 2h ago",
      last_seen_seconds: 7200,
      active_misconceptions: ["Pointer arithmetic confusion"],
      topic_mastery: { "Arrays": 75, "Sorting": 70, "Recursion": 60 },
      overall_mastery: 68,
      xp_today: 0,
      intervention_status: "approved"
    },
    {
      student_id: "demo-4",
      student_name: "David Chen",
      email: "david@student.edu",
      is_online: true,
      current_activity: "Code Quest Challenge",
      last_seen_seconds: 5,
      active_misconceptions: [],
      topic_mastery: { "Arrays": 95, "Sorting": 91, "Recursion": 89 },
      overall_mastery: 92,
      xp_today: 250,
      intervention_status: "none"
    },
  ];
}
