"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Assessment } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, CheckCircle2, Play, AlertCircle, ArrowLeft, ShieldCheck, Target } from "lucide-react";

export default function AssessmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getAssessment(id)
      .then((data) => {
        setAssessment(data);
      })
      .catch((err) => {
        console.error("Failed to fetch assessment:", err);
        setError("Assessment not found or inaccessible.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading assessment details...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <Card className="border-red-200 bg-red-50/50 p-6 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-red-900">Assessment Not Found</h2>
        <p className="text-sm text-red-700">{error || "The requested assessment could not be found."}</p>
        <Link href="/student/assessments">
          <Button variant="outline" className="flex items-center gap-1.5 mx-auto">
            <ArrowLeft className="w-4 h-4" /> Return to Assessments
          </Button>
        </Link>
      </Card>
    );
  }

  const isReassessment = assessment.assessment_type === "reassessment";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/student/assessments" className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
        </Link>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-8 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-indigo-200 border-indigo-400 bg-indigo-950/40 text-xs">
              {isReassessment ? "Follow-Up Reassessment" : "Diagnostic Check"}
            </Badge>
            <span className="text-xs text-indigo-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {assessment.time_limit_minutes || 20} minutes
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">{assessment.title}</h1>
          <p className="text-sm text-indigo-100 max-w-2xl leading-relaxed">
            {assessment.description || "Diagnostic assessment to evaluate understanding and cognitive model state."}
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Questions</p>
              <h3 className="text-2xl font-black text-slate-900">{assessment.questions?.length ?? 0}</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Passing Threshold</p>
              <h3 className="text-2xl font-black text-slate-900">{assessment.passing_score || 60}%</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Evaluation</p>
              <h3 className="text-xs font-bold text-indigo-700 mt-2 bg-indigo-50 py-1 px-2 rounded-md">
                AI Observer + Diagnostic
              </h3>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Instructions & Integrity Guardrails
            </h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Multiple-choice and programming questions will be graded objectively on the backend.</li>
              <li>Your answers feed into the Bayesian Knowledge Tracing (BKT) learner model in real-time.</li>
              <li>If any misconceptions are detected, targeted pedagogical interventions will be prepared.</li>
              <li>You can review and modify your answers until you click &quot;Submit Quiz&quot;.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/student/assessments">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Link href={`/student/assessments/${assessment.id}/take`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 px-6">
                <Play className="w-4 h-4" /> Begin Assessment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
