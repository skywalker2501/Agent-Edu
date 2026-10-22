"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Assessment } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, Clock, Play, AlertCircle, RotateCcw,
  BookOpen, CheckCircle2, Target, Sparkles, RefreshCw,
} from "lucide-react";

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  initial: { label: "Initial Diagnostic", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700", icon: <BookOpen className="w-3.5 h-3.5" /> },
  diagnostic: { label: "Diagnostic Check", color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700", icon: <Target className="w-3.5 h-3.5" /> },
  quiz: { label: "Quiz", color: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700", icon: <Sparkles className="w-3.5 h-3.5" /> },
  reassessment: { label: "Follow-Up Reassessment", color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700", icon: <RotateCcw className="w-3.5 h-3.5" /> },
};

export default function StudentAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssessments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAssessments();
      setAssessments(data);
    } catch (err: any) {
      console.error("Error fetching assessments:", err);
      setError(err?.message || "Could not load assessments. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Assigned Assessments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Formative diagnostic tests, practice assignments, and intervention reassessments.
          </p>
        </div>
        <button
          onClick={loadAssessments}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load assessments</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        /* Empty state */
        <Card className="text-center py-16 border-dashed bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent>
            <ClipboardList className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No assessments assigned</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
              Your teacher hasn't assigned any assessments yet, or they are in another class. Check back soon!
            </p>
            <Link href="/student/dashboard" className="mt-4 inline-block">
              <Button variant="outline" size="sm" className="mt-2 text-xs">
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Assessment cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assessments.map((a) => {
            const meta = TYPE_META[a.assessment_type] || TYPE_META.diagnostic;
            const questionCount = a.questions?.length ?? 0;

            return (
              <div
                key={a.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-md dark:hover:shadow-slate-900/50 transition-all duration-200 hover:-translate-y-0.5 group"
              >
                {/* Card top accent bar */}
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />

                <div className="p-5">
                  {/* Type badge + time */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.color}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {a.time_limit_minutes || 20} min
                    </span>
                  </div>

                  {/* Title & description */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                    {a.title}
                  </h3>
                  {a.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {a.description}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mb-4 py-2.5 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
                      <strong className="text-slate-900 dark:text-slate-100">{questionCount || 3}</strong> Qs
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-violet-500" />
                      <strong className="text-slate-900 dark:text-slate-100">{a.total_points || 30}</strong> pts
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Pass: <strong className="text-slate-900 dark:text-slate-100">{a.passing_score || 60}%</strong>
                    </span>
                    <span className="ml-auto text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                      AI Graded
                    </span>
                  </div>

                  {/* CTA */}
                  <Link href={`/student/assessments/${a.id}/take`}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-semibold text-sm shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50 transition-all">
                      <Play className="w-4 h-4 mr-1.5 fill-white" />
                      Start Assessment
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info bar */}
      {!isLoading && assessments.length > 0 && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          {assessments.length} assessment{assessments.length !== 1 ? "s" : ""} available •
          All submissions are automatically graded and update your Learner Digital Twin
        </p>
      )}
    </div>
  );
}
