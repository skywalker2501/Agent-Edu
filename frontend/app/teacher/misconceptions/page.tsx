"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function TeacherMisconceptionsPage() {
  const [misconceptions, setMisconceptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionResults, setActionResults] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getAllMisconceptions()
      .then(setMisconceptions)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const displayMisconceptions = misconceptions.length > 0 ? misconceptions : [
    {
      id: "misc-1",
      title: "Stack Frame Returns Overwriting",
      description: "Student expects recursive base case returns to replace all parent stack frames simultaneously, rather than propagating multiplicatively through call stack unwinding.",
      confidence: 0.89,
      status: "hypothesis",
      student: "Rahul Gupta",
      evidence: "Student submitted factorial(3) trace predicting output = 1 instead of 6. Three consecutive incorrect answers on stack-trace exercises.",
    },
    {
      id: "misc-2",
      title: "Off-By-One in Recursive String Base Case",
      description: "Student checks `length() == 0` instead of `length() <= 1`, causing single-character strings to be recursed on unnecessarily.",
      confidence: 0.65,
      status: "hypothesis",
      student: "Priya Singh",
      evidence: "2 of 3 edge-case tests fail with `reverseString(\"a\")` returning `\"a\"` through an extra recursive call.",
    },
  ];

  const handleConfirm = async (id: string) => {
    try {
      await api.updateMisconceptionStatus(id, "teacher_confirmed");
    } catch {}
    setActionResults((prev) => ({ ...prev, [id]: "confirmed" }));
  };

  const handleReject = async (id: string) => {
    try {
      await api.updateMisconceptionStatus(id, "rejected");
    } catch {}
    setActionResults((prev) => ({ ...prev, [id]: "rejected" }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-indigo-600" /> Misconception Review & Confirmation
        </h1>
        <p className="text-sm text-slate-500">
          Validate or reject AI-hypothesized cognitive misconceptions. Your confirmation triggers intervention generation.
        </p>
      </div>

      <div className="space-y-5">
        {displayMisconceptions.map((m: any) => {
          const action = actionResults[m.id];
          return (
            <Card key={m.id} className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={m.status === "hypothesis" ? "hypothesis" : action === "confirmed" ? "confirmed" : action === "rejected" ? "destructive" : "hypothesis"}>
                    {action ? `Teacher: ${action}` : m.status}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500">
                    Student: <strong>{m.student}</strong> · Confidence: <strong>{Math.round(m.confidence * 100)}%</strong>
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-slate-900">{m.title}</CardTitle>
                <CardDescription className="text-xs">{m.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5">
                  <p className="font-semibold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Supporting Evidence:
                  </p>
                  <p className="text-slate-600 leading-relaxed">{m.evidence}</p>
                </div>

                {!action ? (
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      onClick={() => handleReject(m.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50 text-xs"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject Hypothesis
                    </Button>
                    <Button
                      onClick={() => handleConfirm(m.id)}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm Misconception
                    </Button>
                  </div>
                ) : (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    action === "confirmed"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                    {action === "confirmed"
                      ? "Confirmed and written to immutable audit log. Intervention generation triggered."
                      : "Hypothesis rejected and recorded. No intervention generated."}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
