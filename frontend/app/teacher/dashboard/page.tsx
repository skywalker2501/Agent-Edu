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
  ChevronRight
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
        if (revRes.status === "fulfilled") setReviews(revRes.value);
        if (clsRes.status === "fulfilled") setClasses(clsRes.value);
      } catch (err) {
        console.error("Failed to load teacher dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const classMasteryData = [
    { topic: "Arrays", avgMastery: 84 },
    { topic: "Sorting", avgMastery: 79 },
    { topic: "Searching", avgMastery: 76 },
    { topic: "Stacks", avgMastery: 62 },
    { topic: "Recursion", avgMastery: 48 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Teacher Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Instructor Intelligence Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Welcome, Dr. {user?.full_name || "Teacher"}!
          </h1>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            You have active student submissions awaiting method validation and candidate interventions ready for pedagogical approval.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/teacher/review-queue">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-md">
              <ClipboardList className="w-4 h-4 mr-1.5 text-indigo-600" />
              Open Review Queue ({reviews.length || 2})
            </Button>
          </Link>
          <Link href="/teacher/simulator">
            <Button variant="outline" size="lg" className="border-indigo-400/40 text-white hover:bg-white/10 font-semibold">
              <Sliders className="w-4 h-4 mr-1.5" />
              Intervention Simulator
            </Button>
          </Link>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Assigned Students</p>
              <h3 className="text-2xl font-bold text-slate-900">24</h3>
              <p className="text-[11px] text-slate-400">CS 101 - Algorithms</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Method Reviews</p>
              <h3 className="text-2xl font-bold text-slate-900">{reviews.length || 2}</h3>
              <p className="text-[11px] text-amber-600 font-medium">1 Alternative Solution</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Interventions</p>
              <h3 className="text-2xl font-bold text-slate-900">1</h3>
              <p className="text-[11px] text-emerald-600 font-medium">Requires Governance Sign-off</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Average Remediation Gain</p>
              <h3 className="text-2xl font-bold text-slate-900">+38%</h3>
              <p className="text-[11px] text-blue-600 font-medium">Post-Intervention Delta</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Review Spotlight & Class Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Action Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alternative Solution Review Alert Banner */}
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="hypothesis" className="text-[10px] uppercase font-bold">
                  Alternative Method Proposed
                </Badge>
                <span className="text-xs font-semibold text-slate-500">Student: Priya Singh</span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 mt-1">
                String Reversal: Recursive Approach vs Iterative Reference
              </CardTitle>
              <CardDescription className="text-xs">
                Student submitted a valid recursive Java implementation with correct base case, which differs from the reference answer (two-pointer iteration).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-white rounded-lg border border-amber-100 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">AI Preliminary Recommendation:</p>
                  <p className="text-slate-600">
                    &quot;Accept Alternative Solution: Correct O(N) recursive formulation with O(N) call stack overhead. Award full marks (10/10).&quot;
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <Link href="/teacher/reviews/rev-priya-string-rev">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs">
                    Inspect in Review Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Class Mastery Profile */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Cohort Mastery Profile
                  </CardTitle>
                  <CardDescription>
                    Aggregated concept mastery across CS 101: Data Structures
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">24 Students</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classMasteryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="topic" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, "Cohort Average"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="avgMastery" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Student Intelligence Quick Roster */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900">
                  Student Intelligence
                </CardTitle>
                <Link href="/teacher/classes" className="text-xs text-indigo-600 font-semibold hover:underline">
                  View All
                </Link>
              </div>
              <CardDescription>
                Real-time Learner Digital Twin state tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Rahul */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Rahul Gupta</h4>
                    <p className="text-[11px] text-slate-400">rahul@agentedu.org</p>
                  </div>
                  <Badge variant="needs_attention" className="text-[10px]">
                    Needs Attention
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                  <span>Weakness: <strong>Recursion Stack Frames</strong> (42%)</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-emerald-600 font-medium">Intervention Ready</span>
                  <Link href="/teacher/simulator" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center">
                    Simulator <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Priya */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Priya Singh</h4>
                    <p className="text-[11px] text-slate-400">priya@agentedu.org</p>
                  </div>
                  <Badge variant="mastered" className="text-[10px]">
                    Mastered
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                  <span>Mastery: <strong>Data Structures (88%)</strong></span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-amber-600 font-medium">Method Review Pending</span>
                  <Link href="/teacher/reviews/rev-priya-string-rev" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center">
                    Review <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="border-indigo-100 bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Pedagogical Governance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/teacher/outcomes" className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition text-xs font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600" /> Outcome Monitoring (Pre/Post)
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/teacher/decision-history" className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition text-xs font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" /> Traceable Decision Audit Log
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
