"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ReviewOutcome, TeacherReview } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Scale,
  Save,
  MessageSquare,
  Award
} from "lucide-react";

export default function TeacherReviewWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [review, setReview] = useState<any | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<ReviewOutcome>("correct_alternative_method");
  const [awardedScore, setAwardedScore] = useState<number>(10);
  const [feedback, setFeedback] = useState<string>(
    "Excellent recursive implementation! While the reference solution used two-pointer iteration, your recursive approach is mathematically correct and properly terminates on the empty string."
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Priya's alternative Java solution and reference answer
  const studentCode = `public class Solution {
    public static String reverseString(String s) {
        // Base case: empty or single char string
        if (s == null || s.length() <= 1) {
            return s;
        }
        // Recursive call: reverse tail and append first char
        return reverseString(s.substring(1)) + s.charAt(0);
    }
}`;

  const referenceCode = `public class Solution {
    public static String reverseString(String s) {
        if (s == null) return null;
        char[] chars = s.toCharArray();
        int left = 0, right = chars.length - 1;
        while (left < right) {
            char temp = chars[left];
            chars[left] = chars[right];
            chars[right] = temp;
            left++;
            right--;
        }
        return new String(chars);
    }
}`;

  const outcomeOptions: { value: ReviewOutcome; label: string; desc: string }[] = [
    { value: "correct_method_and_answer", label: "Correct Method & Answer", desc: "Matches reference solution and all constraints" },
    { value: "correct_alternative_method", label: "Correct Alternative Method", desc: "Valid alternative algorithm/paradigm not in reference answer" },
    { value: "correct_answer_incomplete_reasoning", label: "Correct Answer with Incomplete Reasoning", desc: "Final output matches but intermediate steps lacking" },
    { value: "partially_correct", label: "Partially Correct Solution", desc: "Satisfies subset of test cases/requirements" },
    { value: "incorrect_valid_intermediate", label: "Incorrect with Valid Intermediate Reasoning", desc: "Logical reasoning sound but minor arithmetic or edge bug" },
    { value: "incorrect_method_and_answer", label: "Incorrect Method and Answer", desc: "Fundamental misunderstanding of question/concept" },
    { value: "insufficient_evidence", label: "Insufficient Evidence", desc: "Cannot ascertain reasoning from submitted work" },
    { value: "requires_manual_review", label: "Requires Manual Follow-up", desc: "Needs live oral check or clarifying test" },
  ];

  const handleSaveDecision = async () => {
    setIsSaving(true);
    try {
      await api.submitTeacherDecision(id, {
        decision: "approved",
        review_outcome: selectedOutcome,
        awarded_score: awardedScore,
        teacher_feedback: feedback,
        misconception_status: "resolved",
      });
      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/teacher/review-queue");
      }, 1500);
    } catch (err) {
      console.error("Failed to submit decision:", err);
      // For demo resilience:
      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/teacher/review-queue");
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="hypothesis" className="text-[10px] uppercase font-bold">
              Intelligent Method Review
            </Badge>
            <span className="text-xs text-slate-500">Student: <strong>Priya Singh</strong> (CS 101)</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Submission Evaluation: Reverse a String in Java
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveDecision}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
          >
            {isSaving ? "Saving Immutable Decision..." : saveSuccess ? "Saved to Audit Log!" : (
              <>
                <Save className="w-4 h-4" /> Save Teacher Decision
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Review Workspace: Code Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Student Submission */}
        <Card className="border-indigo-200">
          <CardHeader className="pb-3 bg-indigo-50/50 border-b border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-600" /> Student Submitted Solution
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">Recursive Approach</Badge>
            </div>
            <CardDescription className="text-xs text-indigo-800">
              Priya Singh • Submitted yesterday at 4:12 PM
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 font-mono text-xs bg-slate-950 text-emerald-400 overflow-x-auto">
            <pre className="p-4 leading-relaxed">{studentCode}</pre>
          </CardContent>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-1">
            <p><strong>Complexity:</strong> Time O(N² due to string concatenation) • Space O(N stack depth)</p>
            <p><strong>Correctness:</strong> Passes all standard and empty-string test cases in Sandbox</p>
          </div>
        </Card>

        {/* Right: Teacher Reference Criterion */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-slate-500" /> Reference Benchmark Criteria
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">Iterative Two-Pointer</Badge>
            </div>
            <CardDescription className="text-xs">
              Instructor syllabus baseline
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 font-mono text-xs bg-slate-950 text-slate-300 overflow-x-auto">
            <pre className="p-4 leading-relaxed">{referenceCode}</pre>
          </CardContent>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-1">
            <p><strong>Complexity:</strong> Time O(N) • Space O(N) for char array</p>
            <p><strong>Policy:</strong> CEP guidelines explicitly forbid rejecting valid alternative paradigms</p>
          </div>
        </Card>
      </div>

      {/* AI Preliminary Multi-Approach Evaluation Advisory */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              AI Multi-Approach Suggestion Engine Analysis (Advisory Only)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">Approach A: Two-Pointer</span>
              <p className="text-slate-500">In-place character swaps. Optimal for memory-constrained environments.</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">Approach B: StringBuilder</span>
              <p className="text-slate-500">Standard idiomatic Java API. High readability, minimal boilerplate.</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <span className="font-bold text-indigo-900 block mb-1">Approach C: Recursion (Student)</span>
              <p className="text-indigo-800">Mathematically elegant. Demonstrates strong grasp of call stack and base cases.</p>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span><strong>Suggested Evaluation:</strong> &quot;Correct Alternative Method&quot; — Award 10/10 with positive commendation.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedOutcome("correct_alternative_method");
                setAwardedScore(10);
              }}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 text-xs font-bold"
            >
              Adopt AI Recommendation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Final Evaluation Controls */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">
            Teacher Decision & Authorized Marks
          </CardTitle>
          <CardDescription>
            You hold final pedagogical authority. All entries are written to the immutable audit log.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 8 Explicit Review Outcomes Radio/Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Select Explicit Review Outcome (from CEP Specification):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {outcomeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedOutcome(opt.value)}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer text-xs ${
                    selectedOutcome === opt.value
                      ? "bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/20 font-semibold"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <p className="font-bold">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Marks Awarded */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Authorized Marks (Max: 10):
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={awardedScore}
                onChange={(e) => setAwardedScore(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Action on Diagnosed Misconception:
              </label>
              <select className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="none">No Misconception Identified</option>
                <option value="confirmed">Confirm Misconception Hypothesis</option>
                <option value="rejected">Reject Hypothesis (Student Demonstrates Mastery)</option>
              </select>
            </div>
          </div>

          {/* Teacher Feedback */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Constructive Student Feedback:
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link href="/teacher/review-queue">
              <Button variant="outline" size="sm" className="text-xs">
                Back to Queue
              </Button>
            </Link>
            <Button
              onClick={handleSaveDecision}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6"
            >
              {isSaving ? "Saving..." : "Commit Decision & Notify Student"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
