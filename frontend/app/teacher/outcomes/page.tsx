"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  AlertCircle,
  Users,
  Target
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function OutcomeMonitoringPage() {
  const outcomeData = [
    {
      id: "out-1",
      studentName: "Rahul Gupta",
      concept: "Recursion & Call Stack",
      interventionStrategy: "Worked Example & Stack Trace",
      preScore: 40,
      postScore: 78,
      delta: 38,
      status: "completed",
      assessedAt: "Today",
    },
    {
      id: "out-2",
      studentName: "Priya Singh",
      concept: "String Manipulation",
      interventionStrategy: "Alternative Solution Accepted",
      preScore: 85,
      postScore: 100,
      delta: 15,
      status: "completed",
      assessedAt: "Yesterday",
    },
  ];

  const chartData = [
    { topic: "Recursion", preMastery: 40, postMastery: 78 },
    { topic: "Call Stack", preMastery: 45, postMastery: 72 },
    { topic: "Base Cases", preMastery: 60, postMastery: 85 },
    { topic: "Tree Traversal", preMastery: 55, postMastery: 68 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Compass className="w-6 h-6 text-indigo-600" /> Outcome Monitoring — Pre vs Post Intervention
        </h1>
        <p className="text-sm text-slate-500">
          Longitudinal tracking of intervention efficacy measured via objective pre/post assessment deltas.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Average Score Delta</p>
              <h3 className="text-2xl font-bold text-emerald-700">+26.5%</h3>
              <p className="text-[11px] text-slate-400">Across 2 completed interventions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Students Measured</p>
              <h3 className="text-2xl font-bold text-slate-900">2</h3>
              <p className="text-[11px] text-slate-400">Rahul & Priya</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Efficacy Rate</p>
              <h3 className="text-2xl font-bold text-slate-900">100%</h3>
              <p className="text-[11px] text-slate-400">All interventions showed positive delta</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pre/Post Comparison Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900">
            Pre vs Post Mastery Comparison
          </CardTitle>
          <CardDescription>
            Observed score changes after approved intervention completion — not causal attribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="topic" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(val: any, name?: any) => [`${val}%`, name === "preMastery" ? "Pre-Intervention" : "Post-Intervention"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend
                  formatter={(value) => value === "preMastery" ? "Pre-Intervention" : "Post-Intervention"}
                />
                <Bar dataKey="preMastery" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="postMastery" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Individual Student Outcomes */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Individual Student Outcome Records</h2>
        {outcomeData.map((o) => (
          <Card key={o.id} className="border-slate-200">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="confirmed" className="text-[10px] uppercase font-bold">
                      {o.status}
                    </Badge>
                    <span className="text-xs text-slate-400">{o.assessedAt}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{o.studentName}</h3>
                  <p className="text-xs text-slate-500">
                    Concept: <strong>{o.concept}</strong> · Strategy: {o.interventionStrategy}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Pre</p>
                    <p className="text-2xl font-black text-amber-600">{o.preScore}%</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Post</p>
                    <p className="text-2xl font-black text-emerald-600">{o.postScore}%</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                    <p className="text-[11px] text-emerald-600 font-medium">Delta</p>
                    <p className="text-2xl font-black text-emerald-700">+{o.delta}%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Pre-Intervention</span>
                  <span>{o.preScore}%</span>
                </div>
                <Progress value={o.preScore} className="h-2 bg-slate-200" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Post-Intervention</span>
                  <span>{o.postScore}%</span>
                </div>
                <Progress value={o.postScore} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
