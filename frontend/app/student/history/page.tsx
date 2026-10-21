"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle2, AlertCircle, Sparkles, Sliders, ArrowUpRight } from "lucide-react";

export default function StudentHistoryPage() {
  const events = [
    {
      id: "ev-5",
      type: "reassessment",
      title: "Completed Reassessment: Recursion & Call Stack",
      date: "Today at 10:45 AM",
      score: "78%",
      delta: "+38%",
      description: "Observed mastery improved from 40% to 78%. Objective criteria satisfied.",
      status: "mastered",
    },
    {
      id: "ev-4",
      type: "intervention_complete",
      title: "Completed Intervention: Call Stack Visualization",
      date: "Today at 10:15 AM",
      description: "Completed step-by-step trace of factorial(3) activation records push/pop.",
      status: "confirmed",
    },
    {
      id: "ev-3",
      type: "teacher_approval",
      title: "Teacher Approved Remediation Plan",
      date: "Yesterday at 4:30 PM",
      description: "Dr. Alan Turing approved Strategy A (Worked Example & Call Stack Trace).",
      status: "confirmed",
    },
    {
      id: "ev-2",
      type: "diagnosis",
      title: "Cognitive Misconception Diagnosed",
      date: "Yesterday at 3:15 PM",
      description: "Cognitive Diagnostic Agent identified 'Stack Frame Returns Overwriting'. Confidence: 89%.",
      status: "hypothesis",
    },
    {
      id: "ev-1",
      type: "assessment",
      title: "Initial Diagnostic Quiz Submitted",
      date: "Yesterday at 3:00 PM",
      score: "40%",
      description: "Baseline formative assessment on Recursion execution mechanics.",
      status: "needs_attention",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-600" /> Learning Activity History & Audit Timeline
        </h1>
        <p className="text-sm text-slate-500">
          Traceable chronological record of your assessments, cognitive diagnoses, teacher reviews, and outcome measurements.
        </p>
      </div>

      <div className="relative pl-6 border-l-2 border-indigo-200 space-y-8">
        {events.map((ev) => (
          <div key={ev.id} className="relative">
            {/* Timeline Bullet */}
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white" />

            <Card className="border-slate-200">
              <CardContent className="p-4 sm:p-5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-400">{ev.date}</span>
                  <div className="flex items-center gap-2">
                    {ev.delta && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {ev.delta} Delta
                      </span>
                    )}
                    {ev.score && (
                      <span className="text-xs font-bold text-slate-700">
                        Score: {ev.score}
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
