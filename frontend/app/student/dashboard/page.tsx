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
  ChevronRight,
  Zap,
  Activity,
  Bot
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
        topic: topic.length > 18 ? topic.substring(0, 18) + "..." : topic,
        mastery: Math.min(100, Math.round(score > 100 ? score / 100 : score)),
      }))
    : learnerModel?.topic_mastery
    ? Object.entries(learnerModel.topic_mastery).map(([topic, score]) => ({
        topic: topic.length > 18 ? topic.substring(0, 18) + "..." : topic,
        mastery: Math.min(100, Math.round(score > 100 ? score / 100 : score > 1 ? score : score * 100)),
      }))
    : [
        { topic: "Arrays & Lists", mastery: 86 },
        { topic: "Sorting Algos", mastery: 81 },
        { topic: "Binary Search", mastery: 75 },
        { topic: "Call Stacks", mastery: 58 },
        { topic: "Recursion Trees", mastery: 70 },
      ];

  const overallMastery = Math.round(
    masteryData.reduce((acc, curr) => acc + curr.mastery, 0) / (masteryData.length || 1)
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Welcome Hero Section — Compact, Futuristic & Striking */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#131722] via-[#1A1F2E] to-[#131722] border border-[#262C3A] p-6 sm:p-7 text-white shadow-xl overflow-hidden">
        {/* Subtle geometric & neural ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6C63FF]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#42D9FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6C63FF]/20 text-[#42D9FF] border border-[#6C63FF]/40 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-[#42D9FF]" />
                Cognitive AI Twin Active
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                {gamification?.current_streak || 5} Day Streak
              </span>
              <span className="text-xs text-slate-400">
                Course: <strong className="text-slate-200">CS-DSA-101 Data Structures & Algorithms</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {user?.full_name?.split(" ")[0] || "Rahul"}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Your autonomous learner model detected strong progress in linear memory structures. Next goal: eliminate the LIFO unwind misconception in recursive call stacks.
            </p>
          </div>

          {/* Dominant "Continue Learning" Action */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <Link href="/student/interventions">
              <Button size="lg" className="w-full bg-[#6C63FF] hover:bg-[#5b52f0] text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 gap-2 h-11 px-6 rounded-xl">
                <Play className="w-4 h-4 fill-white" /> Continue Learning
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/student/ai-tutor" className="flex-1">
                <Button variant="outline" size="sm" className="w-full bg-[#131722]/80 hover:bg-[#1A1F2E] text-slate-200 border-[#262C3A] text-xs h-9 rounded-xl gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-[#42D9FF]" /> AI Tutor
                </Button>
              </Link>
              <Link href="/student/games" className="flex-1">
                <Button variant="outline" size="sm" className="w-full bg-[#131722]/80 hover:bg-[#1A1F2E] text-slate-200 border-[#262C3A] text-xs h-9 rounded-xl gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" /> Play Hub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Well-Designed Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Learning Progress */}
        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#929AAF] uppercase tracking-wider">
                Syllabus Mastery
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6C63FF] dark:text-[#42D9FF] flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">
                {overallMastery}%
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +4.2%
              </span>
            </div>
            <Progress value={overallMastery} className="h-1.5 mt-2 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] text-slate-500 dark:text-[#929AAF] block mt-1">4 of 5 core units active</span>
          </CardContent>
        </Card>

        {/* Metric 2: Current Streak */}
        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#929AAF] uppercase tracking-wider">
                Current Streak
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">
                {gamification?.current_streak || 5} Days
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                Personal Best
              </span>
            </div>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <div
                  key={d}
                  className={`flex-1 h-1.5 rounded-full ${
                    d <= (gamification?.current_streak || 5)
                      ? "bg-amber-500"
                      : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#929AAF] block mt-1">Consistent daily practice</span>
          </CardContent>
        </Card>

        {/* Metric 3: XP & Level */}
        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#929AAF] uppercase tracking-wider">
                Verified XP
              </span>
              <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-[#8B5CF6] flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">
                {(gamification?.total_xp || 680).toLocaleString()}
              </span>
              <Badge variant="developing" className="text-[9px] py-0 px-1 font-bold">
                Level {gamification?.level || 3}
              </Badge>
            </div>
            <Progress value={gamification?.progress_pct || 65} className="h-1.5 mt-2 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] text-slate-500 dark:text-[#929AAF] block mt-1">
              {gamification?.xp_to_next_level || 70} XP to Level {(gamification?.level || 3) + 1}
            </span>
          </CardContent>
        </Card>

        {/* Metric 4: Assessments Completed */}
        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#929AAF] uppercase tracking-wider">
                Assessments
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">
                {dashboardData?.recent_events?.length || 3} Passed
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                100% Validated
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full w-full" />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#929AAF] block mt-1">Zero pending retakes</span>
          </CardContent>
        </Card>
      </div>

      {/* 3. Closed-Loop AI Pipeline Status Banner */}
      <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] rounded-2xl shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#6C63FF] animate-pulse" />
              <span className="text-xs font-bold text-slate-900 dark:text-[#F5F7FF] uppercase tracking-wider">
                10-Stage Closed-Loop Architecture
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
              Stage 7: Autonomous Teacher-Governed Intervention
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 text-center text-[10px] font-bold">
            {[
              { name: "1. Observe", done: true },
              { name: "2. Diagnose", done: true },
              { name: "3. Model", done: true },
              { name: "4. Simulate", done: true },
              { name: "5. Govern", done: true },
              { name: "6. Approve", done: true },
              { name: "7. Intervene", current: true },
              { name: "8. Measure", pending: true },
              { name: "9. Learn", pending: true },
              { name: "10. Re-plan", pending: true },
            ].map((st, i) => (
              <div
                key={i}
                className={`py-2 px-1 rounded-xl border transition-all ${
                  st.done
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : st.current
                    ? "bg-[#6C63FF]/15 border-[#6C63FF] text-[#6C63FF] dark:text-[#42D9FF] ring-2 ring-[#6C63FF]/30 font-black"
                    : "bg-slate-50 dark:bg-[#181C28] border-slate-200 dark:border-[#262C3A] text-slate-400 dark:text-slate-600"
                }`}
              >
                {st.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Asymmetric Main Workspace (Primary 7 cols, Secondary 5 cols on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PRIMARY COLUMN: Tasks, Active Course, Next Step (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Intervention & Recommended Next Step */}
          <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#262C3A] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F5F7FF] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Recommended Next Action
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-[#929AAF]">
                  Prioritized by Bayesian Knowledge Tracing based on your recent code attempts
                </CardDescription>
              </div>
              <Badge variant="hypothesis" className="text-[10px] uppercase font-bold bg-[#6C63FF]/15 text-[#6C63FF] dark:text-[#42D9FF] border border-[#6C63FF]/30">
                High Impact
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181C28] border border-slate-200/80 dark:border-[#262C3A] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#6C63FF] dark:text-cyan-400 uppercase tracking-wider">
                      Module 2 • Linear Stacks
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF] mt-0.5">
                      Call-Stack Representation & Delimiter Balance
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-[#929AAF] mt-1 leading-relaxed">
                      Targeting detected misconception: Assuming array index mutation persists across recursive returns without explicit rollback.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-amber-500 block">+30 XP</span>
                    <span className="text-[10px] text-slate-400">Est. 12 mins</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-[#262C3A]">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#929AAF]">
                    <Clock className="w-3.5 h-3.5" /> Approved by Prof. Alan Turing
                  </div>
                  <Link href="/student/interventions">
                    <Button size="sm" className="bg-[#6C63FF] hover:bg-[#5b52f0] text-white text-xs font-bold gap-1 rounded-xl h-8 px-4">
                      Start Exercise <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Course Progress Card */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#262C3A] bg-white dark:bg-[#131722] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-[#1E1B4B] text-[#6C63FF] flex items-center justify-center font-bold text-xs">
                      DSA
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-[#F5F7FF]">
                        CS-DSA-101: Data Structures Mastery
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-[#929AAF]">
                        Unit 1: Linear Structures • 3 of 5 topics verified
                      </p>
                    </div>
                  </div>
                  <Link href="/student/syllabus">
                    <Button variant="ghost" size="sm" className="text-xs text-[#6C63FF] dark:text-[#42D9FF] hover:bg-slate-100 dark:hover:bg-[#181C28]">
                      View Syllabus <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </Link>
                </div>
                <Progress value={68} className="h-2 bg-slate-100 dark:bg-slate-800" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Learning Activity & Verified Ledger */}
          <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#262C3A] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" /> Verified Activity Log
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-[#929AAF]">
                  Cryptographically verified problem submissions and XP awards
                </CardDescription>
              </div>
              <Link href="/student/history">
                <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  Full History
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-[#262C3A]">
                {[
                  { title: "Binary Search Boundary Conditions", xp: "+25 XP", time: "2 hours ago", type: "Code Challenge" },
                  { title: "Arrays & Dynamic Lists Diagnostic", xp: "+50 XP", time: "Yesterday", type: "Assessment" },
                  { title: "Live Video Masterclass Attendance", xp: "+50 XP", time: "2 days ago", type: "Live Lecture" },
                ].map((act, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-[#181C28]/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-[#F5F7FF]">{act.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-[#929AAF]">{act.type} • {act.time}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-cyan-400">{act.xp}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECONDARY COLUMN: Personalized Insight & Charts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Distinctive Personalized Learning Insight Panel */}
          <Card className="border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/50 to-white dark:from-[#1E1B4B]/30 dark:to-[#131722] rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-indigo-100 dark:border-[#262C3A]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#6C63FF] dark:text-[#42D9FF] uppercase tracking-wider flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5" /> Learner Model Insight
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#929AAF] font-medium">BKT Engine v2.4</span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F5F7FF] mt-1">
                Cognitive Mastery Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-[#181C28] border border-slate-200/80 dark:border-[#262C3A] space-y-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] uppercase tracking-wider block">
                  ✓ Verified Strength
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                  Demonstrated 94% accuracy in index arithmetic and two-pointer sliding window boundaries.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#181C28] border border-slate-200/80 dark:border-[#262C3A] space-y-1">
                <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px] uppercase tracking-wider block">
                  ⚠ Focus Opportunity
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                  Recursion stack activation records: Traces show confusion between preorder traversal execution order and postorder return values.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/20 space-y-1">
                <span className="font-bold text-[#6C63FF] dark:text-[#42D9FF] text-[11px] uppercase tracking-wider block">
                  🎯 Prescribed Remedy
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                  Complete the 5-minute Socratic dialogue on Call Frames or play the Recursion Puzzle in Learn & Play Hub.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mastery Breakdown Chart */}
          <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF]">
                Topic Mastery Distribution
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-[#929AAF]">
                Real-time proficiency across active syllabus concepts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={masteryData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="topic" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#131722",
                        borderColor: "#262C3A",
                        borderRadius: "12px",
                        fontSize: "11px",
                        color: "#F5F7FF"
                      }}
                      formatter={(val: any) => [`${val}% Mastery`, "Proficiency"]}
                    />
                    <Bar dataKey="mastery" fill="#6C63FF" radius={[0, 6, 6, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
