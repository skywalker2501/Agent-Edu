"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ClassInfo } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, ArrowRight, User } from "lucide-react";

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getClasses()
      .then(setClasses)
      .catch((err) => console.error("Error fetching classes:", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-600" /> My Enrolled Classes
        </h1>
        <p className="text-sm text-slate-500">
          Courses and academic tracks with AI-scaffolded closed-loop curriculum tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((c) => (
          <Card key={c.id} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="mastered" className="text-[10px] uppercase font-bold">
                  Enrolled & Active
                </Badge>
                <span className="text-xs text-slate-400 font-medium">Spring 2026</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">
                {c.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {c.description || "Foundational algorithms, computational complexity, and dynamic memory models."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <User className="w-4 h-4 text-slate-400" /> Instructor: <strong>Dr. Alan Turing</strong>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Users className="w-4 h-4 text-slate-400" /> 24 Students
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Link href="/student/dashboard" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Progress
                  </Button>
                </Link>
                <Link href="/student/assessments" className="flex-1">
                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                    Class Quizzes <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
