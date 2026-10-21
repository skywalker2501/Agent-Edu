"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  Sliders,
  ClipboardList,
  Bot,
  Network,
  ShieldCheck,
  Compass,
  GraduationCap,
  Users,
  Target,
  ArrowRightLeft
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { loginAsDemo } = useAuth();
  const [launchingRole, setLaunchingRole] = useState<string | null>(null);

  const handleLaunch = async (
    role: "student_rahul" | "student_priya" | "teacher" | "admin",
    targetDest?: string
  ) => {
    setLaunchingRole(role);
    try {
      await loginAsDemo(role);
      let dest = targetDest || "/student/dashboard";
      if (!targetDest) {
        if (role === "teacher") {
          dest = "/teacher/dashboard";
        } else if (role === "admin") {
          dest = "/admin/dashboard";
        }
      }
      window.location.href = dest;
    } catch (err) {
      console.error("Demo launch failed:", err);
      const redirectQuery = targetDest ? `&redirect=${encodeURIComponent(targetDest)}` : "";
      window.location.href = `/auth/login?role=${role}${redirectQuery}`;
    }
  };

  const steps = [
    {
      num: 1,
      stage: "OBSERVE",
      icon: "👁️",
      title: "Learning Observer Agent",
      desc: "Captures every response, code submission, and assessment event to build a timestamped longitudinal record of student behavior.",
      role: "student_rahul" as const,
      dest: "/student/assessments",
      badge: "Student Portal",
      cta: "View Assessments"
    },
    {
      num: 2,
      stage: "DIAGNOSE",
      icon: "🔬",
      title: "Cognitive Diagnostic Agent",
      desc: "Analyzes behavioral patterns, applies rule-based and ML inference, and generates specific misconception hypotheses with confidence scores.",
      role: "student_rahul" as const,
      dest: "/student/misconceptions",
      badge: "Student Portal",
      cta: "Inspect Misconceptions"
    },
    {
      num: 3,
      stage: "MODEL",
      icon: "🧠",
      title: "Learner Digital Twin Agent",
      desc: "Maintains a transparent, mathematically updated Bayesian Knowledge Tracing model per topic and maps concept prerequisite dependencies.",
      role: "student_rahul" as const,
      dest: "/student/knowledge-map",
      badge: "Student Portal",
      cta: "Explore Knowledge Map"
    },
    {
      num: 4,
      stage: "SIMULATE",
      icon: "⚡",
      title: "Intervention Planner & Simulator",
      desc: "Generates ranked candidate interventions with explainable multi-factor scoring including root-cause relevance, prerequisite fit, and difficulty suitability.",
      role: "teacher" as const,
      dest: "/teacher/simulator",
      badge: "Teacher Workspace",
      cta: "Run Simulator"
    },
    {
      num: 5,
      stage: "GOVERN",
      icon: "⚖️",
      title: "Governance & Explainability Agent",
      desc: "Every AI-generated plan requires teacher authorization before reaching students. No intervention bypasses the human-in-the-loop review gate.",
      role: "teacher" as const,
      dest: "/teacher/review-queue",
      badge: "Teacher Workspace",
      cta: "Review Gate"
    },
    {
      num: 6,
      stage: "AUTHORIZE",
      icon: "✅",
      title: "Teacher Review & Approval",
      desc: "Teachers inspect the full AI reasoning, view the evidence chain, select from 8 explicit review outcomes, and award authorized marks.",
      role: "teacher" as const,
      dest: "/teacher/review-queue",
      badge: "Teacher Workspace",
      cta: "Authorize Interventions"
    },
    {
      num: 7,
      stage: "INTERVENE",
      icon: "🎯",
      title: "Personalized Intervention Delivery",
      desc: "Students receive approved, step-by-step interactive pedagogical activities precisely targeted to their diagnosed cognitive gaps.",
      role: "student_rahul" as const,
      dest: "/student/interventions",
      badge: "Student Portal",
      cta: "Start Remediation"
    },
    {
      num: 8,
      stage: "MEASURE",
      icon: "📊",
      title: "Post-Intervention Assessment",
      desc: "A follow-up assessment measures actual score change. Pre/post deltas are computed and linked to the specific intervention decision.",
      role: "student_rahul" as const,
      dest: "/student/assessments",
      badge: "Student Portal",
      cta: "Take Follow-up Test"
    },
    {
      num: 9,
      stage: "LEARN",
      icon: "📈",
      title: "Outcome Agent & Twin Update",
      desc: "Observed changes update the Learner Digital Twin, and the efficacy signal is stored in the intervention outcome database.",
      role: "teacher" as const,
      dest: "/teacher/outcomes",
      badge: "Teacher Workspace",
      cta: "View Efficacy Analytics"
    },
    {
      num: 10,
      stage: "RE-PLAN",
      icon: "🔄",
      title: "Adaptive Re-Planning",
      desc: "The orchestrator determines next-best action: close the loop with a new diagnostic cycle or escalate to teacher with a detailed outcome report.",
      role: "student_rahul" as const,
      dest: "/student/ai-tutor",
      badge: "Socratic AI Tutor",
      cta: "Chat with AI Tutor"
    },
  ];

  const features = [
    { icon: BrainCircuit, title: "Learner Digital Twin", desc: "Persistent, transparent BKT-based cognitive model updated with every student interaction. Supports misconception root-cause graph.", role: "student_rahul" as const, dest: "/student/knowledge-map" },
    { icon: Network, title: "Misconception Knowledge Graph", desc: "Directed prerequisite dependency graph identifying root causes of conceptual errors — not just surface-level performance dips.", role: "student_rahul" as const, dest: "/student/knowledge-map" },
    { icon: ClipboardList, title: "Intelligent Teacher Review", desc: "8 explicit review outcomes, alternative solution acceptance, marks adjustment, and immutable versioned audit log per decision.", role: "teacher" as const, dest: "/teacher/review-queue" },
    { icon: Sliders, title: "Intervention Simulator", desc: "Side-by-side comparison of ranked candidate strategies with fully explainable scoring formulas for pedagogical transparency.", role: "teacher" as const, dest: "/teacher/simulator" },
    { icon: Bot, title: "Socratic AI Tutor", desc: "5 teaching modes: Explain, Give Hint, Worked Example, Guide Step-by-Step, and Test Understanding. Never provides spoiler answers.", role: "student_rahul" as const, dest: "/student/ai-tutor" },
    { icon: Compass, title: "Outcome Monitoring", desc: "Longitudinal pre/post intervention efficacy tracking with attribution to specific teacher-approved pedagogical strategies.", role: "teacher" as const, dest: "/teacher/outcomes" },
    { icon: ShieldCheck, title: "Human-in-the-Loop Governance", desc: "Every AI decision requires explicit teacher authorization before impacting a student. Full auditability by design.", role: "teacher" as const, dest: "/teacher/review-queue" },
    { icon: Target, title: "Multi-Approach Engine", desc: "Compares alternative solution methods (recursive, iterative, two-pointer) and helps teachers validate diverse valid approaches.", role: "teacher" as const, dest: "/teacher/review-queue" },
  ];

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">AgentEdu</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleLaunch("teacher")}
              disabled={!!launchingRole}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 transition cursor-pointer"
            >
              🧑‍🏫 Teacher Demo
            </button>
            <button
              type="button"
              onClick={() => handleLaunch("student_rahul")}
              disabled={!!launchingRole}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer hidden sm:inline-block"
            >
              🎓 Student Demo
            </button>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl -top-40 left-1/2 -translate-x-1/2" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            6 Cognitive AI Agents · 10-Step Closed-Loop Orchestration
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-5xl mx-auto mb-6">
            The{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Adaptive AI Learning Platform
            </span>{" "}
            Educators Actually Trust
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed mb-8">
            AgentEdu combines agentic AI with human-in-the-loop pedagogical governance to observe, diagnose, model, simulate, govern, intervene, and measure learning outcomes — transparently and accountably.
          </p>

          {/* 1-Click Launch Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button
              onClick={() => handleLaunch("teacher")}
              disabled={!!launchingRole}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-900/40 transition cursor-pointer disabled:opacity-60"
            >
              {launchingRole === "teacher" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entering Teacher Portal...
                </>
              ) : (
                <>
                  Try 1-Click Demo (Teacher Portal) <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <button
              onClick={() => handleLaunch("student_rahul")}
              disabled={!!launchingRole}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-base border border-slate-700 transition cursor-pointer disabled:opacity-60"
            >
              {launchingRole === "student_rahul" ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  Entering Student Portal...
                </>
              ) : (
                <>
                  <GraduationCap className="w-5 h-5 text-indigo-400" /> Demo as Student (Rahul)
                </>
              )}
            </button>
          </div>

          {/* Quick Persona Pills */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-slate-400 px-2 font-medium flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" /> Instant Access:
            </span>
            <button
              onClick={() => handleLaunch("teacher")}
              disabled={!!launchingRole}
              className="px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-200 font-semibold transition cursor-pointer"
            >
              🧑‍🏫 Dr. Alan Turing (Teacher)
            </button>
            <button
              onClick={() => handleLaunch("student_rahul")}
              disabled={!!launchingRole}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold transition cursor-pointer"
            >
              🎒 Rahul Gupta (Recursion Gap)
            </button>
            <button
              onClick={() => handleLaunch("student_priya")}
              disabled={!!launchingRole}
              className="px-3 py-1.5 rounded-lg bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 text-violet-200 font-semibold transition cursor-pointer"
            >
              👩‍🎓 Priya Singh (Alt Method)
            </button>
            <button
              onClick={() => handleLaunch("admin")}
              disabled={!!launchingRole}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-semibold transition cursor-pointer"
            >
              🛡️ Admin Console
            </button>
          </div>
        </div>
      </section>

      {/* Social Proof / Persona Strip */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { role: "student_rahul" as const, title: "Student (Rahul Gupta)", outcome: "Score: 40% → 78%", detail: "After teacher-approved Call Stack Worked Example intervention targeting a diagnosed stack frame misconception.", tag: "Click to Demo as Rahul" },
            { role: "student_priya" as const, title: "Student (Priya Singh)", outcome: "Alternative Method Validated", detail: "Recursive string reversal accepted over iterative reference solution. Full marks awarded with positive commendation.", tag: "Click to Demo as Priya" },
            { role: "teacher" as const, title: "Dr. Alan Turing", outcome: "3 Reviews Completed", detail: "Misconception confirmed, intervention approved, and outcome deltas monitored — all within the traceable teacher workspace.", tag: "Click to Demo as Teacher" },
          ].map((p) => (
            <button
              key={p.role}
              onClick={() => handleLaunch(p.role)}
              disabled={!!launchingRole}
              className="p-5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 transition text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">{p.title}</p>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-300 font-mono transition">
                  {launchingRole === p.role ? "Entering..." : p.tag + " →"}
                </span>
              </div>
              <p className="text-base font-bold text-white mt-1 mb-2">{p.outcome}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{p.detail}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 10-Step Closed-Loop Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Click Any Step to Launch Interactive Demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            The 10-Step Closed-Loop Learning Engine
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
            Every student session triggers a principled, state-machine orchestrated cycle — from observation to adaptive re-planning. Click any step below to explore that agent in action.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => handleLaunch(s.role, s.dest)}
              disabled={!!launchingRole}
              className="text-left p-5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/70 transition-all duration-200 group cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-indigo-950/50 hover:scale-[1.02] disabled:opacity-60"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      Step {s.num} · {s.stage}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 group-hover:border-indigo-500/40 group-hover:text-indigo-300 transition">
                    {s.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-indigo-300 transition">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300">
                {launchingRole === s.role ? (
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    Launching...
                  </span>
                ) : (
                  <>
                    <span>{s.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-slate-800 bg-slate-900/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Core Capabilities
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              Transparent pedagogical algorithms combined with uncompromising human governance. Click to inspect live.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.title}
                  type="button"
                  onClick={() => handleLaunch(f.role, f.dest)}
                  disabled={!!launchingRole}
                  className="p-5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-600/60 transition text-left cursor-pointer flex flex-col justify-between group hover:scale-[1.02] disabled:opacity-60"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:bg-indigo-500/30 transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-indigo-300 transition">{f.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <span>Try Feature</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA / Demo Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Ready to see it in action?
        </h2>
        <p className="text-slate-300 text-base max-w-xl mx-auto mb-10 leading-relaxed">
          Sign in with a 1-click demo persona and explore the full Rahul remediation journey, Priya&apos;s alternative solution review, or the teacher&apos;s closed-loop governance workspace.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-6">
          {[
            { role: "student_rahul" as const, label: "Rahul (Student)", desc: "Recursion journey" },
            { role: "student_priya" as const, label: "Priya (Student)", desc: "Alt solution" },
            { role: "teacher" as const, label: "Alan (Teacher)", desc: "Review & govern" },
            { role: "admin" as const, label: "Admin", desc: "System overview" },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => handleLaunch(p.role)}
              disabled={!!launchingRole}
              className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-600/50 transition text-center cursor-pointer disabled:opacity-60"
            >
              <p className="text-xs font-bold text-white">{p.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{launchingRole === p.role ? "Launching..." : p.desc}</p>
            </button>
          ))}
        </div>
        <button
          onClick={() => handleLaunch("teacher")}
          disabled={!!launchingRole}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-900/40 transition cursor-pointer disabled:opacity-60"
        >
          {launchingRole === "teacher" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Launching Teacher Demo Portal...
            </>
          ) : (
            <>
              Launch Teacher Demo Portal <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-5 w-5 rounded bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-slate-400">AgentEdu</span>
        </div>
        <p>Adaptive AI Education Platform · Built on CEP Specification · Human-in-the-Loop by Design</p>
        <div className="flex justify-center gap-4 mt-3 text-slate-600">
          <Link href="/auth/login" className="hover:text-slate-300 transition">Sign In</Link>
          <Link href="/auth/register" className="hover:text-slate-300 transition">Register</Link>
        </div>
      </footer>
    </div>
  );
}
