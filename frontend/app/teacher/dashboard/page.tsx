"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  ClipboardList,
  Sliders,
  Compass,
  History,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Radio,
  FileCheck2
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [revRes, clsRes] = await Promise.allSettled([
          api.getTeacherReviewQueue(),
          api.getClasses(),
        ]);
        if (revRes.status === "fulfilled" && Array.isArray(revRes.value)) setReviews(revRes.value);
        if (clsRes.status === "fulfilled" && Array.isArray(clsRes.value)) setClasses(clsRes.value);
      } catch (err) {
        console.error("Failed to load teacher dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const classMasteryData = [
    { topic: "Arrays & Pointers", avgMastery: 84 },
    { topic: "Sorting Techniques", avgMastery: 79 },
    { topic: "Binary Search", avgMastery: 76 },
    { topic: "Call Stacks", avgMastery: 62 },
    { topic: "Recursion Trees", avgMastery: 48 },
  ];

  const teacherFirstName = user?.full_name ? String(user.full_name).trim().split(/\s+/)[0] : "Alan";

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Teacher Workspace Hero */}
      <div className="bg-gradient-to-r from-[#131722] via-[#1A1F2E] to-[#131722] border border-[#262C3A] rounded-2xl p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C63FF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6C63FF]/20 text-[#42D9FF] border border-[#6C63FF]/40">
              Instructor Governance Studio
            </span>
            <span className="text-xs text-slate-400">• Closed-Loop Pedagogical Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome, Prof. {teacherFirstName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {reviews.length || 2} student alternative methods await pedagogical validation. Candidate interventions are queued for teacher approval.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5 shrink-0">
          <Link href="/teacher/review-queue">
            <Button size="lg" className="bg-[#6C63FF] hover:bg-[#5b52f0] text-white font-bold text-xs sm:text-sm shadow-md gap-1.5 h-10 px-5 rounded-xl">
              <ClipboardList className="w-4 h-4" />
              Review Queue ({reviews.length || 2})
            </Button>
          </Link>
          <Link href="/teacher/classes">
            <Button variant="outline" size="lg" className="border-[#262C3A] bg-[#181C28] text-slate-200 hover:bg-[#1E2433] text-xs font-semibold h-10 px-4 rounded-xl gap-1.5">
              <Users className="w-4 h-4 text-[#42D9FF]" />
              Manage Classes
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-[#6C63FF] dark:text-[#42D9FF]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#929AAF] font-medium">Assigned Students</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">24</h3>
              <p className="text-[11px] text-slate-400 dark:text-[#929AAF]">CS 101 Mastery</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-500">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#929AAF] font-medium">Pending Reviews</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">{reviews.length || 2}</h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">1 Alternative Solution</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-500">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#929AAF] font-medium">Active Interventions</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">1</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">100% Governed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-800 flex items-center justify-center text-[#8B5CF6]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#929AAF] font-medium">Remediation Delta</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">+38%</h3>
              <p className="text-[11px] text-[#6C63FF] dark:text-[#42D9FF] font-bold">Post-Intervention Gain</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Review Spotlight & Class Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Action Items (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/20 dark:via-[#131722] dark:to-[#131722] rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-amber-200/60 dark:border-[#262C3A]">
              <div className="flex items-center justify-between">
                <Badge variant="hypothesis" className="text-[10px] uppercase font-bold bg-amber-500 text-slate-950 border-none">
                  Alternative Method Proposed
                </Badge>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Student: Priya Singh</span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F5F7FF] mt-1">
                String Reversal: Recursive Approach vs Iterative Reference
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-[#929AAF]">
                Student submitted a valid recursive Java implementation with correct base case, which differs from the reference answer (two-pointer iteration).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="p-3.5 bg-white dark:bg-[#181C28] rounded-xl border border-amber-200/80 dark:border-[#262C3A] text-xs">
                <p className="font-bold text-slate-900 dark:text-[#F5F7FF]">AI Verification Note:</p>
                <p className="text-slate-600 dark:text-[#929AAF] mt-1 leading-relaxed">
                  &quot;Accept Alternative Solution: Correct O(N) recursive formulation with O(N) call stack overhead. Award full marks (10/10).&quot;
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <Link href="/teacher/reviews/rev-priya-string-rev">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-9">
                    Inspect in Review Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Class Roster Links */}
          <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#262C3A] flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF]">
                Active Class Sections
              </CardTitle>
              <Link href="/teacher/classes">
                <Button variant="ghost" size="sm" className="text-xs text-[#6C63FF] dark:text-[#42D9FF]">
                  Manage All Classes →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181C28] border border-slate-200/80 dark:border-[#262C3A] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#F5F7FF]">
                    CS-101: Data Structures & Algorithms
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#929AAF]">Code: DSA101 • 24 Students Enrolled</p>
                </div>
                <Link href="/teacher/classes">
                  <Button size="sm" variant="outline" className="text-xs rounded-lg h-7 border-slate-300 dark:border-slate-700">
                    View Roster
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cohort Mastery Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF]">
                    Cohort Mastery Distribution
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-[#929AAF]">
                    Aggregated concept mastery across CS 101
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono">24 Students</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="h-56 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classMasteryData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="topic" type="category" axisLine={false} tickLine={false} width={105} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#131722",
                        borderColor: "#262C3A",
                        borderRadius: "12px",
                        fontSize: "11px",
                        color: "#F5F7FF"
                      }}
                      formatter={(val: any) => [`${val}% Average`, "Cohort Mastery"]}
                    />
                    <Bar dataKey="avgMastery" fill="#6C63FF" radius={[0, 6, 6, 0]} barSize={14} />
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
