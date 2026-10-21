"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ShieldCheck, User, Clock, FileText } from "lucide-react";

export default function DecisionHistoryPage() {
  const decisions = [
    {
      id: "dec-4",
      type: "intervention_approval",
      title: "Approved Intervention: Strategy A — Worked Example",
      subject: "Rahul Gupta",
      outcome: "approved",
      detail: "Approved Worked Example strategy as highest-evidence approach for diagnosed stack frame misconception.",
      timestamp: "Today at 10:05 AM",
      immutable: true,
    },
    {
      id: "dec-3",
      type: "review_decision",
      title: "Alternative Solution Accepted: String Reversal (Recursive)",
      subject: "Priya Singh",
      outcome: "correct_alternative_method",
      detail: "Authorized recursive approach. Awarded 10/10 marks. Added positive commendation to student record.",
      timestamp: "Yesterday at 4:45 PM",
      immutable: true,
    },
    {
      id: "dec-2",
      type: "misconception_confirmation",
      title: "Misconception Confirmed: Stack Frame Returns Overwriting",
      subject: "Rahul Gupta",
      outcome: "teacher_confirmed",
      detail: "Confirmed AI hypothesis with 89% confidence. Ordered diagnostic review of prerequisite activation record knowledge.",
      timestamp: "Yesterday at 3:30 PM",
      immutable: true,
    },
    {
      id: "dec-1",
      type: "review_decision",
      title: "Review: Diagnostic Quiz Score Verified",
      subject: "Rahul Gupta",
      outcome: "partially_correct",
      detail: "Manually verified 40% score. Noted student reached base case condition correctly but misunderstood accumulative return propagation.",
      timestamp: "Yesterday at 3:25 PM",
      immutable: true,
    },
  ];

  const outcomeColors: Record<string, string> = {
    approved: "confirmed",
    correct_alternative_method: "mastered",
    teacher_confirmed: "developing",
    partially_correct: "needs_attention",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-600" /> Traceable Decision Audit Log
        </h1>
        <p className="text-sm text-slate-500">
          Every teacher decision is written as an immutable, versioned record to ensure full pedagogical accountability and compliance.
        </p>
      </div>

      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        All records in this log are immutable and cryptographically timestamped. No decision can be edited or deleted after submission.
      </div>

      <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6">
        {decisions.map((d) => (
          <div key={d.id} className="relative">
            <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white" />
            <Card className="border-slate-200">
              <CardContent className="p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={(outcomeColors[d.outcome] as any) || "outline"} className="text-[10px] uppercase font-bold">
                      {d.outcome.replace(/_/g, " ")}
                    </Badge>
                    {d.immutable && (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> IMMUTABLE
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {d.timestamp}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{d.title}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Student: <strong>{d.subject}</strong>
                </p>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {d.detail}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
