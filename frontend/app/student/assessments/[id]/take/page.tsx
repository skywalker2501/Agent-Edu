"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Assessment, SubmissionResult } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Code2,
  Send,
  ArrowRight,
  BrainCircuit,
  Sparkles,
  HelpCircle,
  XCircle,
} from "lucide-react";

export default function TakeAssessmentPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getAssessment(id)
      .then((data) => {
        setAssessment(data);
        // Prepopulate initial empty answers
        const initialAnswers: Record<string, any> = {};
        if (data.questions) {
          data.questions.forEach((q) => {
            const isCode = q.question_type === "coding" || q.question_type === "programming";
            if (isCode) {
              initialAnswers[q.id] = q.starter_code || "# Write your solution here\n";
            } else {
              initialAnswers[q.id] = "";
            }
          });
        }
        setAnswers(initialAnswers);
      })
      .catch((err) => {
        console.error("Failed to fetch assessment:", err);
        setError("Failed to load assessment. It may have expired or been moved.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleOptionSelect = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleTextChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    setIsSubmitting(true);
    setError(null);

    const formattedAnswers = (assessment.questions || []).map((q) => {
      const val = answers[q.id];
      const isCode = q.question_type === "coding" || q.question_type === "programming";
      return {
        question_id: q.id,
        student_answer: typeof val === "string" ? val : String(val ?? ""),
        code_language: isCode ? "python" : undefined,
      };
    });

    try {
      const res = await api.submitAssessment({
        assessment_id: assessment.id,
        answers: formattedAnswers,
        time_spent_seconds: 320,
      });
      setResult(res);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(err?.message || "Failed to submit assessment. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Preparing assessment questions...</p>
      </div>
    );
  }

  if (error && !result) {
    return (
      <Card className="border-red-200 bg-red-50/50 p-6 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-red-900">Unable to Load Assessment</h2>
        <p className="text-sm text-red-700">{error}</p>
        <Link href="/student/assessments">
          <Button variant="outline">Return to Assessments</Button>
        </Link>
      </Card>
    );
  }

  // Result View after successful submission
  if (result) {
    const score = result.grading?.total_score ?? result.score ?? 0;
    const maxScore = result.grading?.max_score ?? result.max_score ?? 30;
    const pct = Math.round(result.grading?.percentage ?? (maxScore > 0 ? (score / maxScore) * 100 : 0));
    const passed = result.grading?.passed ?? pct >= 60;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <Card className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800/90 shadow-lg overflow-hidden">
          <div className="bg-emerald-600 dark:bg-emerald-700 p-6 text-white text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-white" />
            <h2 className="text-2xl font-bold">Assessment Submitted Successfully!</h2>
            <p className="text-emerald-100 text-sm mt-1">
              Your responses have been processed by the server-side grading engine and registered in your Learner Digital Twin.
            </p>
          </div>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Calculated Score</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{score} / {maxScore}</h3>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Percentage</p>
                <h3 className={`text-2xl font-black ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {pct}%
                </h3>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status</p>
                <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  passed
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                }`}>
                  {passed ? "Passed / Mastered" : "Needs Review"}
                </span>
              </div>
            </div>

            {/* Cognitive Agent Insights */}
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Cognitive Diagnostic Feedback
              </div>
              <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                {result.next_action_recommendation || result.feedback ||
                  "The Observer and Diagnostic agents analyzed your execution trace. The Learner Model has updated your concept masteries accordingly."}
              </p>
            </div>

            {/* Breakdown per question if answers returned */}
            {result.answers && result.answers.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Detailed Results
                </h4>
                <div className="space-y-2">
                  {result.answers.map((ans, idx) => (
                    <div key={ans.id || idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {ans.is_correct ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                        )}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Question {idx + 1}</span>
                        {ans.automated_feedback && (
                          <span className="text-slate-500 dark:text-slate-400 ml-2">({ans.automated_feedback})</span>
                        )}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {ans.score_awarded ?? 0} / {ans.max_score ?? 10} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link href="/student/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700 dark:text-slate-200">
                  Return to Dashboard
                </Button>
              </Link>
              <Link href="/student/knowledge-map" className="w-full sm:w-auto">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  Inspect Updated Knowledge Map <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz Taking Screen
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header Bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs sticky top-20 z-20 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{assessment?.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{assessment?.questions?.length || 0} Questions • Automated grading</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Time: 18:42</span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scoring...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Submit Quiz
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {(assessment?.questions ?? []).map((q, index) => {
          const isMultipleChoice = q.question_type === "multiple_choice" || q.question_type === "multiple_select";
          const isCoding = q.question_type === "coding" || q.question_type === "programming";
          const isShortAnswer = q.question_type === "short_answer";

          return (
            <Card key={q.id} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Question {index + 1} of {assessment?.questions?.length ?? 0}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                      {q.question_type}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{q.points || 10} pts</span>
                  </div>
                </div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  {q.prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Multiple Choice Options */}
                {isMultipleChoice && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt: any, optIdx: number) => {
                      const optKey = typeof opt === "object" && opt?.id ? String(opt.id) : String.fromCharCode(65 + optIdx);
                      const optText = typeof opt === "object" ? String(opt.text || opt.title || opt.label || opt.id || "") : String(opt);
                      const isSelected = answers[q.id] === optKey;

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleOptionSelect(q.id, optKey)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs sm:text-sm font-medium flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                              : "bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800"
                            }`}
                          >
                            {optKey}
                          </div>
                          <span className="flex-1 text-slate-800 dark:text-slate-200">{optText}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {isShortAnswer && (
                  <div>
                    <textarea
                      rows={3}
                      value={answers[q.id] || ""}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      placeholder="Type your explanation or response..."
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                )}

                {/* Code Response Editor */}
                {isCoding && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Code2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Solution Code Editor
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">Python 3 Safe Execution Sandbox</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 font-mono text-xs">
                      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 text-slate-400 text-[11px] flex items-center justify-between">
                        <span>solution.py</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Isolated Container</span>
                      </div>
                      <textarea
                        rows={8}
                        value={answers[q.id] || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="# Write your implementation here"
                        className="w-full p-4 bg-transparent text-emerald-400 focus:outline-none resize-y font-mono text-xs leading-relaxed"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Submit Action */}
      <div className="flex items-center justify-end gap-4 pt-4 pb-12">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md"
        >
          {isSubmitting ? "Scoring & Diagnosing..." : "Submit Completed Assessment"}
        </Button>
      </div>
    </div>
  );
}
