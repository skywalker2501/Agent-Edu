"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { TeacherReview } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Sparkles,
  Code2
} from "lucide-react";

export default function TeacherReviewQueuePage() {
  const [reviews, setReviews] = useState<TeacherReview[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getTeacherReviewQueue()
      .then(setReviews)
      .catch((err) => {
        console.error("Failed to fetch review queue:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Demo fallback items if queue is empty
  const displayReviews = reviews.length > 0 ? reviews : [
    {
      id: "rev-priya-string-rev",
      submission_id: "sub-priya-string-rev",
      student_id: "student-priya",
      student_name: "Priya Singh",
      question_id: "q-str-rev",
      question_title: "Reverse a String in Java",
      status: "pending",
      review_type: "alternative_solution",
      ai_preliminary_evaluation: {
        suggested_outcome: "correct_alternative_method",
        confidence: 0.94,
        reasoning: "Valid recursive Java implementation. O(N) time and O(N) stack space.",
      },
      created_at: new Date().toISOString(),
    },
    {
      id: "rev-rahul-recursion",
      submission_id: "sub-rahul-diag",
      student_id: "student-rahul",
      student_name: "Rahul Gupta",
      question_id: "q-fact-trace",
      question_title: "Trace Factorial(3) Call Stack Output",
      status: "pending",
      review_type: "misconception_check",
      ai_preliminary_evaluation: {
        suggested_outcome: "incorrect_valid_intermediate",
        confidence: 0.89,
        reasoning: "Identified stack frame return value overwriting error.",
      },
      created_at: new Date().toISOString(),
    },
  ];

  const filtered = displayReviews.filter((r) => {
    if (filter === "pending") return r.status === "pending";
    if (filter === "completed") return r.status === "approved" || r.status === "rejected";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" /> Student Submissions Review Queue
          </h1>
          <p className="text-sm text-slate-500">
            Intelligent teacher review workspace: validate AI preliminary evaluations, accept alternative solutions, and award authorized marks.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(["all", "pending", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition cursor-pointer ${
                filter === tab ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item: any) => (
            <Card key={item.id} className="border-slate-200 hover:border-indigo-300 transition-all">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.review_type === "alternative_solution" ? "hypothesis" : "developing"}>
                      {item.review_type === "alternative_solution" ? "Alternative Solution Detected" : "Diagnostic Check"}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-700">
                      Student: <strong>{item.student_name || "Student"}</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.question_title || "Computer Science Exercise"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Advisory:</span>
                    <span className="font-semibold text-slate-700">
                      {item.ai_preliminary_evaluation?.suggested_outcome?.replace(/_/g, " ") || "Review required"}
                    </span>
                    <span>(Confidence: {Math.round((item.ai_preliminary_evaluation?.confidence || 0.9) * 100)}%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link href={`/teacher/reviews/${item.id}`}>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs whitespace-nowrap">
                      Open Review Workspace <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
