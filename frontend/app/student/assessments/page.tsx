"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Assessment } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, CheckCircle2, Play, AlertCircle, ArrowRight } from "lucide-react";

export default function StudentAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getAssessments()
      .then(setAssessments)
      .catch((err) => console.error("Error fetching assessments:", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Assigned Assessments
          </h1>
          <p className="text-sm text-slate-500">
            Formative diagnostic tests, practice assignments, and intervention reassessments.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No assessments assigned</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Check back soon or consult your teacher for upcoming quizzes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map((a) => {
            const isReassessment = a.assessment_type === "reassessment";
            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={isReassessment ? "mastered" : "developing"}>
                      {isReassessment ? "Follow-Up Reassessment" : "Diagnostic Check"}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {a.time_limit_minutes || 20} mins
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {a.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {a.description || "Evaluates conceptual understanding, edge cases, and recursive execution mechanics."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Questions: <strong>{a.questions?.length ?? 3}</strong></span>
                    <span>Max Score: <strong>{a.total_points || 30} pts</strong></span>
                    <span>Evaluation: <strong>Automated + AI Method Review</strong></span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Link href={`/student/assessments/${a.id}/take`} className="flex-1">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                        <Play className="w-4 h-4 mr-1.5" /> Start Assessment
                      </Button>
                    </Link>
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
