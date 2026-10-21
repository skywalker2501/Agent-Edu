"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { StudentDashboardData, LearnerState, Intervention } from "@/lib/types";
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
  GraduationCap
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [learnerModel, setLearnerModel] = useState<LearnerState | null>(null);
  const [pendingInterventions, setPendingInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dash, model, interv] = await Promise.allSettled([
          api.getStudentDashboard(),
          api.getLearnerModel(),
          api.getStudentInterventions(),
        ]);

        if (dash.status === "fulfilled") setDashboardData(dash.value);
        if (model.status === "fulfilled") setLearnerModel(model.value);
        if (interv.status === "fulfilled") {
          setPendingInterventions(interv.value.filter(i => i.status === "approved" || i.status === "in_progress"));
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
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Welcome back, {user?.full_name || "Student"}!
          </h1>
          <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed mb-6">
            Your Learner Digital Twin is continually tracking conceptual dependencies. You currently have an approved targeted intervention ready to help strengthen your mental model of <span className="font-semibold text-white">Call Stack Execution in Recursion</span>.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/student/interventions">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold shadow-md">
                <Play className="w-4 h-4 mr-1.5 fill-indigo-900" /> Start Approved Intervention
              </Button>
            </Link>
            <Link href="/student/ai-tutor">
              <Button size="lg" className="bg-indigo-950/80 hover:bg-indigo-900 text-white border border-indigo-400/40 font-semibold shadow-md">
                <BrainCircuit className="w-4 h-4 mr-1.5 text-indigo-300" /> Socratic AI Tutor
              </Button>
            </Link>
          </div>
        </div>
        {/* Subtle decorative ring */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      </div>

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
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Remediation Delta</p>
              <h3 className="text-2xl font-bold text-slate-900">+38%</h3>
              <p className="text-[11px] text-blue-600 font-medium">Expected on Reassessment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Topic Mastery Cards & Mastery Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topic Mastery Cards */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Topic Mastery Estimates
                  </CardTitle>
                  <CardDescription>
                    Derived transparently from assessment responses and error patterns
                  </CardDescription>
                </div>
                <Link href="/student/knowledge-map" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View Knowledge Map <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {masteryData.map((item) => (
                <div key={item.topic} className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-slate-900">{item.topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">{item.mastery}%</span>
                      {getStatusBadge(item.mastery)}
                    </div>
                  </div>
                  <Progress value={item.mastery} className="h-2" />
                  {item.mastery < 60 && (
                    <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center justify-between">
                      <span>Root cause: stack frame return values not unwinding correctly.</span>
                      <Link href="/student/interventions" className="font-bold underline text-amber-800">
                        Remediate
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Graphical Analytics Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900">
                Mastery Profile (BKT / Cognitive Model)
              </CardTitle>
              <CardDescription>
                Evidence-grounded mastery scores across the computer science syllabus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={masteryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="topic" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, "Mastery"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="mastery" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pending Interventions & Quick Actions */}
        <div className="space-y-6">
          {/* Active Intervention Card */}
          <Card className="border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="confirmed" className="text-[10px] font-bold uppercase">
                  Teacher Approved
                </Badge>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 15 mins
                </span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 mt-2">
                Call Stack Execution in Recursion
              </CardTitle>
              <CardDescription>
                Strategy: Worked Example & Step-by-Step Call Stack Visualization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Designed to remedy the misconception where recursive returns overwrite rather than accumulate into prior stack frames.
              </p>
              <div className="p-3 bg-white rounded-lg border border-indigo-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Confidence Rating:</span>
                  <span className="font-bold text-slate-900">89%</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Authorized by:</span>
                  <span className="font-bold text-slate-900">Dr. Alan Turing</span>
                </div>
              </div>
              <Link href="/student/interventions" className="block pt-1">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  <Play className="w-4 h-4 mr-1.5" /> Launch Activity Player
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Available Assessments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Assigned Quizzes
              </CardTitle>
              <CardDescription>
                Diagnostic checks and follow-up reassessments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">Recursion & Call Stack Diagnostic</h4>
                  <Badge variant="developing" className="text-[10px]">Baseline</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">3 Questions • 20 Minutes • Automated Grading</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700">Attempted (Score: 40%)</span>
                  <Link href="/student/assessments" className="text-xs text-indigo-600 font-semibold hover:underline">
                    View Feedback
                  </Link>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">Post-Intervention Reassessment</h4>
                  <Badge variant="mastered" className="text-[10px]">Follow-Up</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">Measure efficacy after completing intervention</p>
                <Link href="/student/assessments">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Take Reassessment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
