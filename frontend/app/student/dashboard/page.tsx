"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { StudentDashboardData, LearnerState, Intervention, GamificationProfile } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  BookOpen,
  Play,
  RotateCcw,
  Target,
  GraduationCap,
  Flame,
  Trophy,
  Award,
  Gamepad2,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [learnerModel, setLearnerModel] = useState<LearnerState | null>(null);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [pendingInterventions, setPendingInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dash, model, interv, gameProfile] = await Promise.allSettled([
          api.getStudentDashboard(),
          api.getLearnerModel(),
          api.getStudentInterventions(),
          api.getGamificationProfile(),
        ]);

        if (dash.status === "fulfilled") setDashboardData(dash.value);
        if (model.status === "fulfilled") setLearnerModel(model.value);
        if (interv.status === "fulfilled") {
          setPendingInterventions(interv.value.filter(i => i.status === "approved" || i.status === "in_progress"));
        }
        if (gameProfile.status === "fulfilled") {
          setGamification(gameProfile.value);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const masteryData = (dashboardData?.mastery_summary && Object.keys(dashboardData.mastery_summary).length > 0)
    ? Object.entries(dashboardData.mastery_summary).map(([topic, score]) => ({
        topic,
        mastery: Math.min(100, Math.round(score > 100 ? score / 100 : score)),
      }))
    : learnerModel?.topic_mastery
    ? Object.entries(learnerModel.topic_mastery).map(([topic, score]) => ({
        topic,
        mastery: Math.min(100, Math.round(score > 100 ? score / 100 : score > 1 ? score : score * 100)),
      }))
    : [
        { topic: "Arrays & Dynamic Lists", mastery: 86 },
        { topic: "Sorting Algorithms", mastery: 81 },
        { topic: "Searching & Binary Search", mastery: 75 },
        { topic: "Stacks & Call Frames", mastery: 58 },
        { topic: "Recursion & Base Cases", mastery: 70 },
      ];

  const getStatusBadge = (mastery: number) => {
    if (mastery >= 80) return <Badge variant="mastered">Mastered</Badge>;
    if (mastery >= 60) return <Badge variant="developing">Developing</Badge>;
    return <Badge variant="needs_attention">Needs Attention</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Agentic Closed-Loop Engine Active
            </span>
            {gamification && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {gamification.current_streak} Day Streak
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Welcome back, {user?.full_name || "Student"}!
          </h1>
          <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed mb-6">
            Your Learner Digital Twin continuously monitors conceptual dependencies. Continue working on your approved interventions, syllabus challenges, and Socratic tutoring sessions.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/student/interventions">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold shadow-md">
                <Play className="w-4 h-4 mr-1.5 fill-indigo-900" /> Continue Learning
              </Button>
            </Link>
            <Link href="/student/games">
              <Button size="lg" className="bg-indigo-700/80 hover:bg-indigo-700 text-white border border-indigo-400/30 font-semibold shadow-md">
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" /> Learn & Play Hub
              </Button>
            </Link>
            <Link href="/student/ai-tutor">
              <Button size="lg" className="bg-indigo-950/80 hover:bg-indigo-900 text-white border border-indigo-400/40 font-semibold shadow-md">
                <BrainCircuit className="w-4 h-4 mr-1.5 text-indigo-300" /> Socratic AI Tutor
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      </div>

      {/* Gamification Progress & Level Bar */}
      {gamification && (
        <Card className="border-indigo-100 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-600 font-extrabold text-lg shadow-sm">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level {gamification.level}</span>
                    <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 text-xs font-semibold">
                      {gamification.level_title}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {gamification.total_xp.toLocaleString()} <span className="text-xs text-slate-500 font-medium">Total XP Points</span>
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Link href="/student/leaderboard">
                  <Button variant="outline" size="sm" className="bg-white text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> View Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Progress to next rank</span>
                <span>{gamification.xp_to_next_level > 0 ? `${gamification.xp_to_next_level} XP remaining` : "Top Level Reached"}</span>
              </div>
              <Progress value={gamification.progress_pct} className="h-2.5 bg-slate-200" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Closed-Loop Workflow Status Indicator */}
      <Card className="border-indigo-100 bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" /> Closed-Loop Learning Pipeline Status
            </span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Stage 7: Intervene & Remediate
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 text-center text-[10px] font-semibold">
            {[
              { step: "1. Observe", active: true, done: true },
              { step: "2. Diagnose", active: true, done: true },
              { step: "3. Model", active: true, done: true },
              { step: "4. Simulate", active: true, done: true },
              { step: "5. Govern", active: true, done: true },
              { step: "6. Approve", active: true, done: true },
              { step: "7. Intervene", active: true, done: false },
              { step: "8. Measure", active: false, done: false },
              { step: "9. Learn", active: false, done: false },
              { step: "10. Re-plan", active: false, done: false },
            ].map((s, idx) => (
              <div
                key={idx}
                className={`py-2 px-1 rounded-md border transition-all ${
                  s.done
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : s.active
                    ? "bg-indigo-50 border-indigo-300 text-indigo-800 ring-2 ring-indigo-500/20 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                {s.step}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Enrolled Courses</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {dashboardData?.enrolled_classes?.length ?? 1}
              </h3>
              <p className="text-[11px] text-slate-400">Data Structures & Algos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Identified Misconceptions</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {learnerModel?.active_misconceptions?.length ?? 1}
              </h3>
              <p className="text-[11px] text-amber-600 font-medium">Stack Frame Returns</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Interventions</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {pendingInterventions.length || 1}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium">Teacher Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Average Mastery</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {Math.round(masteryData.reduce((acc, m) => acc + m.mastery, 0) / masteryData.length)}%
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium">Top 15% in cohort</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Mastery Breakdown & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Knowledge Gaps & Misconception Alert Section */}
          <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-slate-50 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Identified Knowledge Gaps & Mental Models
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Targeted prerequisite gaps and misconceptions diagnosed by the AI engine
                </CardDescription>
              </div>
              <Link href="/student/misconceptions">
                <Button variant="outline" size="sm" className="text-xs h-7 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-100/50">
                  View All Gaps ({dashboardData?.knowledge_gaps?.length ?? 2}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {(dashboardData?.knowledge_gaps && dashboardData.knowledge_gaps.length > 0) ? (
                dashboardData.knowledge_gaps.map((gap, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white/80 dark:bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          gap.severity === "critical"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {gap.severity} Gap
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {gap.topic_name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {gap.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href="/student/ai-tutor">
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          Ask Tutor
                        </Button>
                      </Link>
                      <Link href="/student/interventions">
                        <Button size="sm" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                          Remediate
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white/80 dark:bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                      Critical Gap
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                      Recursion: Stack-Frame Execution Misunderstood
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Student anticipates immediate base return without unwinding call-stack frame calculations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href="/student/interventions">
                      <Button size="sm" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                        Remediate Now
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Syllabus Topic Mastery Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Topic Mastery Breakdown</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Real-time cognitive diagnosis across DSA syllabus modules
                </CardDescription>
              </div>
              <Link href="/student/knowledge-map">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700">
                  View Map <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={masteryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} unit="%" />
                    <YAxis dataKey="topic" type="category" tick={{ fontSize: 11, fill: "#334155" }} width={140} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, "Estimated Mastery"]}
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="mastery" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Topic Progress Items */}
              <div className="mt-6 divide-y divide-slate-100">
                {masteryData.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.topic}</p>
                      <p className="text-xs text-slate-400">Target confidence: 85%</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-right font-bold text-sm text-slate-700">
                        {item.mastery}%
                      </div>
                      {getStatusBadge(item.mastery)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Games & Activities Launch */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-600" />
                Play & Practice Activities
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Earn verified XP and sharpen core concepts through syllabus-linked learning games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link href="/student/games?tab=quiz-battle" className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 flex items-center justify-between">
                    Quiz Battle
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Timed syllabus challenge (+50 XP)</p>
                </Link>

                <Link href="/student/games?tab=code-quest" className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm">
                    <Play className="w-4 h-4 fill-white" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 flex items-center justify-between">
                    Code Quest
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Java & Python programming (+70 XP)</p>
                </Link>

                <Link href="/student/games?tab=flashcards" className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 flex items-center justify-between">
                    Flashcard Sprint
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Spaced repetition memory practice</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Active Interventions & Recommendations */}
        <div className="space-y-6">
          {/* Active Interventions Card */}
          <Card className="border-indigo-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Prescribed Interventions
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {pendingInterventions.length} Ready
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Teacher-approved remediation tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Worked Example
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 15 mins
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Recursive Call Stack Execution Diagram
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Traces frame allocations and return paths for Factorial & Fibonacci to resolve frame exhaustion.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Approved by Dr. Aris
                  </span>
                  <Link href="/student/interventions">
                    <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">
                      Launch
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Guided Practice
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 20 mins
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Two-Pointer Boundary Edge Cases
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Interactive practice focusing on array bounds and pointer convergence invariants.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Pending Teacher Review</span>
                  <Link href="/student/interventions">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      View Status
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Socratic Tutor Mini Prompt */}
          <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none shadow-md">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Socratic AI Tutor</h4>
                  <p className="text-[11px] text-indigo-300">Grounded in DSA Syllabus</p>
                </div>
              </div>
              <p className="text-xs text-indigo-100/90 leading-relaxed">
                Stuck on a homework problem or algorithm? Get guided hints without having the full answer spoiled.
              </p>
              <Link href="/student/ai-tutor" className="block pt-1">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                  Ask a Socratic Question
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
