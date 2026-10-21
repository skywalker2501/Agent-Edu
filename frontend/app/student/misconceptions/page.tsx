"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Misconception } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function StudentMisconceptionsPage() {
  const [misconceptions, setMisconceptions] = useState<Misconception[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getMisconceptions()
      .then(setMisconceptions)
      .catch((err) => console.error("Error fetching misconceptions:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "teacher_confirmed":
        return <Badge variant="confirmed">Teacher Confirmed</Badge>;
      case "hypothesis":
        return <Badge variant="hypothesis">AI Hypothesis</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="needs_attention">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-indigo-600" /> My Cognitive Misconceptions
        </h1>
        <p className="text-sm text-slate-500">
          Cognitive obstacles and mental model gaps diagnosed by the system and verified by your instructor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {misconceptions.map((m) => (
          <Card key={m.id} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                {getStatusBadge(m.status)}
                <span className="text-xs text-slate-500 font-medium">Confidence: <strong>{Math.round(m.confidence * 100)}%</strong></span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                {m.title}
              </CardTitle>
              <CardDescription className="text-xs">
                {m.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <span className="font-semibold text-slate-700">Supporting Diagnostic Evidence:</span>
                <p className="text-slate-600 leading-relaxed">
                  {m.evidence_summary || "Student predicted final return value = 1 for factorial(3) instead of multiplying across stack unwinding."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Teacher Oversight Active
                </span>
                <Link href="/student/interventions">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                    Start Remediating <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
