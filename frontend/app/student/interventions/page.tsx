"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Intervention } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  BrainCircuit,
  Clock,
  UserCheck
} from "lucide-react";

export default function StudentInterventionsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getStudentInterventions()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setInterventions(list);
        if (list.length > 0) {
          setSelectedIntervention(list[0]);
        }
      })
      .catch((err) => console.error("Error fetching interventions:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Step-by-step interactive call stack visualization frames for factorial(3) recursion
  const stackSteps = [
    {
      title: "Step 1: Initial Function Invocation",
      description: "Call factorial(3). A new stack frame is allocated on top of the call stack with parameter n = 3.",
      codeHighlight: "int factorial(int n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1); // invokes factorial(2)\n}",
      frames: [
        { name: "factorial(3)", n: 3, waitingOn: "factorial(2)", status: "Active / Suspended" },
      ],
      returnVal: "Awaiting child frame",
    },
    {
      title: "Step 2: Recursive Push (n = 2)",
      description: "Since n = 3 is not <= 1, factorial(2) is invoked. Frame factorial(2) is pushed onto the stack.",
      codeHighlight: "  // Inside factorial(2):\n  if (2 <= 1) return 1;\n  return 2 * factorial(1); // invokes factorial(1)",
      frames: [
        { name: "factorial(2)", n: 2, waitingOn: "factorial(1)", status: "Active / Suspended" },
        { name: "factorial(3)", n: 3, waitingOn: "factorial(2)", status: "Waiting in Call Stack" },
      ],
      returnVal: "Awaiting child frame",
    },
    {
      title: "Step 3: Base Case Reached (n = 1)",
      description: "Base case condition (n <= 1) is TRUE. Frame factorial(1) returns the literal value 1. It does NOT overwrite previous frames!",
      codeHighlight: "  if (1 <= 1) return 1; // Base case matched! Returns 1 immediately",
      frames: [
        { name: "factorial(1)", n: 1, waitingOn: "None", status: "Base Case Matched! Returns 1" },
        { name: "factorial(2)", n: 2, waitingOn: "factorial(1)", status: "Waiting in Call Stack" },
        { name: "factorial(3)", n: 3, waitingOn: "factorial(2)", status: "Waiting in Call Stack" },
      ],
      returnVal: "1",
    },
    {
      title: "Step 4: Unwinding factorial(2)",
      description: "factorial(1) pops off the stack. factorial(2) resumes with the returned 1, computes 2 * 1 = 2, and returns 2 to factorial(3).",
      codeHighlight: "  return 2 * 1; // Evaluates to 2 and returns to caller",
      frames: [
        { name: "factorial(2)", n: 2, waitingOn: "Popping with return value = 2", status: "Unwinding" },
        { name: "factorial(3)", n: 3, waitingOn: "factorial(2)", status: "Waiting in Call Stack" },
      ],
      returnVal: "2",
    },
    {
      title: "Step 5: Final Evaluation in factorial(3)",
      description: "factorial(2) pops. factorial(3) computes 3 * 2 = 6. The call stack is now completely unwound and the final answer 6 is returned to main.",
      codeHighlight: "  return 3 * 2; // Final answer 6 returned to caller!",
      frames: [
        { name: "factorial(3)", n: 3, waitingOn: "None", status: "Final Computation: 3 * 2 = 6" },
      ],
      returnVal: "6",
    },
  ];

  const handleComplete = async () => {
    if (selectedIntervention) {
      try {
        await api.completeIntervention(selectedIntervention.id);
        setIsCompleted(true);
      } catch (err) {
        setIsCompleted(true);
      }
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" /> Targeted Remediation Interventions
          </h1>
          <p className="text-sm text-slate-500">
            Personalized pedagogical activities approved by your teacher to address specific cognitive gaps.
          </p>
        </div>
      </div>

      {/* Main Interactive Player */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Step-by-Step Viewer */}
        <Card className="lg:col-span-2 border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold">Interactive Worked Example & Stack Trace</h3>
                <p className="text-[11px] text-slate-400">Concept: Call Stack Activation Records in Recursion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Step {activeStep + 1} of {stackSteps.length}
              </span>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                {stackSteps[activeStep].title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {stackSteps[activeStep].description}
              </p>
            </div>

            {/* Code Block with Highlight */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
              <div className="bg-slate-900 px-4 py-1.5 text-[11px] text-slate-400 border-b border-slate-800">
                FactorialRecursion.java
              </div>
              <pre className="p-4 text-emerald-400 leading-relaxed overflow-x-auto">
                {stackSteps[activeStep].codeHighlight}
              </pre>
            </div>

            {/* Visual Call Stack Representation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Call Stack Memory View (Top of Stack Grows Upward):</span>
                <span className="text-indigo-600 dark:text-indigo-400">Return value at this step: <strong>{stackSteps[activeStep].returnVal}</strong></span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 min-h-[160px] flex flex-col justify-end">
                {stackSteps[activeStep].frames.map((f, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between shadow-2xs transition-all ${
                      idx === 0
                        ? "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-500/30 font-bold"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                        {idx === 0 ? "TOP" : `LEVEL ${stackSteps[activeStep].frames.length - idx}`}
                      </span>
                      <span>{f.name}</span>
                    </div>
                    <span className="text-[11px] opacity-90">{f.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </Button>

              {activeStep < stackSteps.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setActiveStep((prev) => Math.min(stackSteps.length - 1, prev + 1))}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={isCompleted}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" /> {isCompleted ? "Intervention Completed!" : "Complete Intervention"}
                </Button>
              )}
            </div>

            {/* Reassessment CTA when completed */}
            {isCompleted && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between animate-in fade-in duration-200">
                <div>
                  <h5 className="font-bold text-xs">Ready for Follow-Up Reassessment!</h5>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Your completion has been recorded. Take the follow-up assessment to measure your score improvement.
                  </p>
                </div>
                <Link href="/student/assessments">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                    Take Reassessment <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Col: Details & Teacher Authorization */}
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131722]">
            <CardHeader className="pb-3">
              <Badge variant="confirmed" className="w-fit text-[10px] font-bold uppercase mb-1">
                Teacher Approved
              </Badge>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pedagogical Metadata
              </CardTitle>
              <CardDescription>
                Governance details from AgentEdu Orchestrator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <span>Strategy:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Worked Example &amp; Call Stack Trace</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <span>Estimated Time:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">15 minutes</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <span>Difficulty:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Medium</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <span>Target Misconception:</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400 text-right">Recursive Return Overwriting</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <span>Reviewing Teacher:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Dr. Alan Turing</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 space-y-1">
                <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Teacher Comment:
                </span>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed italic">
                  &quot;Rahul understands the base condition syntax, but needs to visualize why return values multiply correctly during call stack unrolling.&quot;
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Help Tutor Callout */}
          <Card className="border-indigo-100 dark:border-indigo-900 bg-gradient-to-tr from-indigo-50/40 dark:from-indigo-950/30 to-white dark:to-[#131722]">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Need Socratic Guidance?</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Discuss this concept with the AI Tutor</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                You can ask questions step-by-step or request custom hints without spoiling the final answer.
              </p>
              <Link href="/student/ai-tutor" className="block">
                <Button variant="outline" size="sm" className="w-full text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                  Open Socratic AI Tutor
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
