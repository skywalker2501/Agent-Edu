"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Plus, ChevronRight, GraduationCap, Trash2 } from "lucide-react";

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getClasses()
      .then(setClasses)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const displayClasses = classes.length > 0 ? classes : [
    {
      id: "cls-1",
      name: "CS 101: Data Structures & Algorithms",
      description: "Core computer science foundational curriculum covering arrays, stacks, queues, trees, sorting, and recursion.",
      studentCount: 24,
      topicCount: 8,
      semester: "Spring 2026",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" /> Classes & Rosters
          </h1>
          <p className="text-sm text-slate-500">
            Manage your class sections and enrolled student rosters.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5">
          <Plus className="w-4 h-4" /> Create New Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayClasses.map((c: any) => (
          <Card key={c.id} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="mastered" className="text-[10px] uppercase font-bold">Active</Badge>
                <span className="text-xs text-slate-400">{c.semester || "Spring 2026"}</span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900">{c.name}</CardTitle>
              <CardDescription className="text-xs">{c.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xl font-bold text-slate-900">{c.studentCount || 24}</p>
                  <p className="text-slate-500">Students</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xl font-bold text-slate-900">{c.topicCount || 8}</p>
                  <p className="text-slate-500">Topics</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xl font-bold text-slate-900">3</p>
                  <p className="text-slate-500">Quizzes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Link href="/teacher/dashboard" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Intelligence
                  </Button>
                </Link>
                <Link href="/teacher/review-queue" className="flex-1">
                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                    Review Queue <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
