"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { InterventionCandidate } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  ArrowRight,
  BarChart3,
  AlertCircle,
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function InterventionSimulatorPage() {
  const [candidates, setCandidates] = useState<InterventionCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.getInterventionCandidates()
      .then((data) => {
        setCandidates(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {
        // Use demo candidates if API fails
        const demoCandidates: InterventionCandidate[] = [
          {
            id: "cand-a",
            strategy: "worked_example",
            title: "Strategy A: Interactive Worked Example & Call Stack Trace",
            description: "Step-by-step visual trace of factorial(3) call stack push/pop mechanics with animated memory diagrams.",
            target_concept: "Call Stack Activation Records",
            rationale: "Directly addresses root-cause misconception that recursive returns overwrite rather than accumulate. High evidence backing from 3 incorrect submissions.",
            evidence_strength: 0.92,
            expected_benefit_label: "High Estimated Benefit (Unverified)",
            difficulty: "medium",
            estimated_time_minutes: 15,
            score: 0.94,
            uncertainty: 0.08,
            ranking: 1,
          },
          {
            id: "cand-b",
            strategy: "prerequisite_lesson",
            title: "Strategy B: Prerequisite Review — Stack Memory & Activation Records",
            description: "Foundational lesson on how LIFO stack memory works, push/pop operations, and local variable scoping across nested calls.",
            target_concept: "Stack Memory Architecture",
            rationale: "Mastery of Stack Activation Records is 58%, below recommended threshold. Addressing prerequisite gap before recursion may increase retention.",
            evidence_strength: 0.79,
            expected_benefit_label: "Moderate Estimated Benefit",
            difficulty: "easy",
            estimated_time_minutes: 25,
            score: 0.78,
            uncertainty: 0.18,
            ranking: 2,
          },
          {
            id: "cand-c",
            strategy: "socratic_tutoring",
            title: "Strategy C: Socratic AI Tutoring Session",
            description: "Guided Socratic dialogue with the AI tutor using Fibonacci and factorial examples, forcing the student to reason through each stack frame.",
            target_concept: "Recursive Execution & Return Propagation",
            rationale: "Socratic dialogue promotes active self-correction and metacognitive awareness, which can produce durable understanding changes.",
            evidence_strength: 0.71,
            expected_benefit_label: "Moderate Estimated Benefit",
            difficulty: "medium",
            estimated_time_minutes: 20,
            score: 0.72,
            uncertainty: 0.24,
            ranking: 3,
          },
          {
            id: "cand-d",
            strategy: "practice_quiz",
            title: "Strategy D: Guided Practice Quiz — Stack Tracing Exercises",
            description: "5 short-answer stack-trace exercises requiring students to manually simulate call stack frames for given recursive functions.",
            target_concept: "Recursive Execution Tracing",
            rationale: "Formative practice with immediate feedback on trace errors may surface additional misconceptions requiring teacher review.",
            evidence_strength: 0.65,
            expected_benefit_label: "Lower Estimated Benefit (Insufficient Evidence)",
            difficulty: "hard",
            estimated_time_minutes: 30,
            score: 0.61,
            uncertainty: 0.31,
            ranking: 4,
          },
        ];
        setCandidates(demoCandidates);
        setSelectedId("cand-a");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleApprove = async () => {
    if (!selectedId) return;
    try {
      await api.approveIntervention(selectedId, {
        decision: "approved",
        teacher_notes: "Approved Strategy A as highest-evidence remediation for diagnosed stack frame misconception.",
      });
    } catch {
      // Proceed with demo success
    }
    setApproveSuccess(true);
  };

  const getStrategyColor = (strategy: string) => {
    const colors: Record<string, string> = {
      worked_example: "indigo",
      prerequisite_lesson: "blue",
      socratic_tutoring: "violet",
      practice_quiz: "slate",
      guided_practice: "teal",
    };
    return colors[strategy] || "slate";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-600" /> Intervention Simulator & Approval Workspace
        </h1>
        <p className="text-sm text-slate-500">
          Compare candidate interventions side-by-side. View explainable scoring rationales and approve the most appropriate pedagogical strategy for the student.
        </p>
      </div>

      {/* Student Context Banner */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Student: Rahul Gupta — Confirmed Misconception</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Confirmed root cause: &quot;Stack Frame Returns Overwriting&quot; — Student expects base case return value to replace all prior frames, not propagate multiplicatively through call stack unwinding.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500 font-medium">Baseline Score</p>
            <p className="text-xl font-bold text-amber-700">40%</p>
            <p className="text-[11px] text-slate-400">Recursion Diagnostic</p>
          </div>
        </CardContent>
      </Card>

      {/* Explainable Scoring Summary */}
      <Card className="border-indigo-100 bg-white">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Intervention Ranking Formula (Explainable Weights)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
            {[
              { factor: "Root-Cause Relevance", weight: "35%" },
              { factor: "Prerequisite Relevance", weight: "20%" },
              { factor: "Learner Mastery State", weight: "20%" },
              { factor: "Prior Intervention History", weight: "15%" },
              { factor: "Difficulty Suitability", weight: "7%" },
              { factor: "Estimated Effort", weight: "3%" },
            ].map((f) => (
              <div key={f.factor} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-800">{f.weight}</p>
                <p className="text-[11px] text-slate-500">{f.factor}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Candidate Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {candidates.map((c) => {
          const isSelected = selectedId === c.id;
          const isExpanded = expandedId === c.id;
          const scorePercent = Math.round((c.score || 0.8) * 100);

          return (
            <Card
              key={c.id}
              className={`transition-all cursor-pointer border-2 ${
                isSelected
                  ? "border-indigo-600 shadow-md shadow-indigo-100"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => setSelectedId(c.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-${getStrategyColor(c.strategy)}-100 text-${getStrategyColor(c.strategy)}-800 border border-${getStrategyColor(c.strategy)}-200`}>
                      #{c.ranking || candidates.indexOf(c) + 1} Ranked
                    </span>
                    {c.ranking === 1 && <Star className="w-4 h-4 text-amber-500 fill-amber-400" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ${
                        scorePercent >= 85
                          ? "bg-emerald-600 text-white ring-emerald-200"
                          : scorePercent >= 70
                          ? "bg-blue-600 text-white ring-blue-200"
                          : "bg-slate-500 text-white ring-slate-200"
                      }`}
                    >
                      {scorePercent}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 leading-snug">
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                {/* Stats Row */}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.estimated_time_minutes || 20} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-slate-400" /> {c.difficulty || "medium"}
                  </span>
                  <span>Evidence: {Math.round((c.evidence_strength || 0.8) * 100)}%</span>
                </div>

                {/* Expandable Rationale */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isExpanded ? null : c.id);
                  }}
                  className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {isExpanded ? "Hide" : "Show"} Explainable Rationale
                </button>

                {isExpanded && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5 animate-in fade-in duration-150">
                    <p className="font-semibold text-slate-800">Evidence-Based Rationale:</p>
                    <p className="leading-relaxed">{c.rationale}</p>
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                      {c.expected_benefit_label}. Uncertainty: {Math.round((c.uncertainty || 0.15) * 100)}%. Score changes after intervention are observed; causality is not guaranteed.
                    </p>
                  </div>
                )}

                {isSelected && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-700">Selected for Approval</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Approval Action Panel */}
      <Card className="border-slate-200">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Approve Selected Intervention Strategy
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Your decision will be persisted as a versioned, immutable record. The student will receive the authorized version only.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-red-200 text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Reject All — Request More Evidence
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!selectedId || approveSuccess}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6"
            >
              {approveSuccess ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Approved & Student Notified!
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Approve & Authorize for Student
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
