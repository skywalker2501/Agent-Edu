"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Misconception } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Bot,
  RefreshCw,
  Clock,
  BookOpen,
  Target,
  Compass
} from "lucide-react";

export default function StudentMisconceptionsPage() {
  const [misconceptions, setMisconceptions] = useState<Misconception[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMisconceptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getMisconceptions();
      setMisconceptions(data || []);
    } catch (err: any) {
      console.error("Error fetching misconceptions:", err);
      setError(err?.message || "Could not load diagnosed misconceptions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMisconceptions();
  }, [fetchMisconceptions]);

  const getStatusBadge = (status: string) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("teacher_confirmed") || s.includes("confirmed")) {
      return (
        <Badge variant="confirmed" className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Teacher Confirmed
        </Badge>
      );
    }
    if (s.includes("hypothesis")) {
      return (
        <Badge variant="hypothesis" className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Hypothesis
        </Badge>
      );
    }
    if (s.includes("rejected")) {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (s.includes("resolved")) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Remediated & Resolved
        </Badge>
      );
    }
    return <Badge variant="needs_attention">{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Cognitive Misconception Diagnosis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mental model obstacles and root-cause misconceptions detected from your assessments and verified with teacher governance.
          </p>
        </div>
        <button
          onClick={fetchMisconceptions}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load misconceptions</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : misconceptions.length === 0 ? (
        /* Empty State */
        <Card className="text-center py-16 border-dashed bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
          <CardContent className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                No Active Misconceptions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Great job! Your mental models align with curriculum principles. Take diagnostic assessments or play learning games to challenge your retention.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/student/assessments">
                <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                  Take Assessment
                </Button>
              </Link>
              <Link href="/student/games">
                <Button variant="outline" size="sm" className="text-xs">
                  Practice in Games Hub
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Misconception Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {misconceptions.map((m) => {
            const title = m.title || (m.concept && m.root_cause ? `${m.concept}: ${m.root_cause}` : m.concept || "Cognitive Misconception");
            const confPct = Math.round((m.confidence || 0.8) * 100);

            return (
              <Card
                key={m.id}
                className="border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {getStatusBadge(m.status)}
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-indigo-500" />
                      Confidence: <strong className="text-slate-900 dark:text-slate-100">{confPct}%</strong>
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    {m.description || "Identified systematically through formative submission answer pattern analysis."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Root Cause & Diagnostic Evidence */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Diagnosed Root Cause:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed font-mono text-[11px]">
                      {m.root_cause || "Prerequisite mental model conflict"}
                    </p>

                    {m.evidence_summary && (
                      <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800 mt-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Supporting Diagnostic Evidence:</span>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {m.evidence_summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Pedagogical Oversight Active
                    </span>

                    <div className="flex items-center gap-2">
                      <Link href="/student/ai-tutor">
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          <Bot className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Ask AI Tutor
                        </Button>
                      </Link>
                      <Link href="/student/interventions">
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">
                          Remediate <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
