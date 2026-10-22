"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  X,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  ShieldCheck,
  BookOpen,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";

interface SimEvent {
  id: string;
  stage: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
  color: string;
  ts: Date;
}

const PIPELINE_STAGES = [
  { stage: "assessment_submitted", label: "Assessment Submitted", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700", detail: "Student submitted diagnostic assessment" },
  { stage: "gap_detected", label: "Gap Detected", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700", detail: "Knowledge gap identified via Bayesian model" },
  { stage: "intervention_recommended", label: "Intervention Recommended", icon: <BrainCircuit className="w-3.5 h-3.5" />, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-700", detail: "AI agents proposed 3 remediation strategies" },
  { stage: "teacher_reviewed", label: "Teacher Reviewed", icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700", detail: "Prof. Alan Turing approved strategy #2" },
  { stage: "activity_completed", label: "Activity Completed", icon: <BookOpen className="w-3.5 h-3.5" />, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700", detail: "Worked example completed in 14 minutes" },
  { stage: "outcome_evaluated", label: "Outcome Evaluated", icon: <Target className="w-3.5 h-3.5" />, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700", detail: "Post-test score: 87% (+23 pts)" },
  { stage: "learner_model_updated", label: "Learner Model Updated", icon: <Zap className="w-3.5 h-3.5" />, color: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700", detail: "Mastery updated • +50 XP awarded" },
];

export function SimulationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as events are added
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events]);

  const startSimulation = () => {
    setEvents([]);
    setCurrentStageIdx(0);
    setIsRunning(true);
  };

  useEffect(() => {
    if (!isRunning) return;
    if (currentStageIdx >= PIPELINE_STAGES.length) {
      setIsRunning(false);
      return;
    }
    const stage = PIPELINE_STAGES[currentStageIdx];
    const delay = currentStageIdx === 0 ? 300 : 1400 + Math.random() * 600;
    const timer = setTimeout(() => {
      setEvents((prev) => [
        ...prev,
        {
          id: `${stage.stage}-${Date.now()}`,
          stage: stage.stage,
          label: stage.label,
          detail: stage.detail,
          icon: stage.icon,
          color: stage.color,
          ts: new Date(),
        },
      ]);
      setCurrentStageIdx((i) => i + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [isRunning, currentStageIdx]);

  const clearEvents = () => {
    setEvents([]);
    setCurrentStageIdx(0);
    setIsRunning(false);
  };

  // Live event counter badge
  const liveCount = events.length;
  const progress = PIPELINE_STAGES.length > 0 ? (liveCount / PIPELINE_STAGES.length) * 100 : 0;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-300/40 dark:shadow-indigo-900/60 font-semibold text-sm transition-all duration-200 hover:scale-105 cursor-pointer"
        title="Open Live Pipeline Simulator"
      >
        <Activity className="w-4 h-4 animate-pulse" />
        <span className="hidden sm:inline">Live Pipeline</span>
        {liveCount > 0 && !isOpen && (
          <span className="ml-1 bg-white text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {liveCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-300" />
              <div>
                <h3 className="text-sm font-bold">Live Pipeline Simulator</h3>
                <p className="text-[10px] text-indigo-300">Closed-loop 10-stage learning workflow</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          {(isRunning || liveCount > 0) && (
            <div className="h-1 bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Stage legend */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/40">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Pipeline Stages</p>
            <div className="flex flex-wrap gap-1">
              {PIPELINE_STAGES.map((s, i) => {
                const done = i < liveCount;
                const active = i === liveCount && isRunning;
                return (
                  <span
                    key={s.stage}
                    className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border transition-all ${
                      done
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                        : active
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-400"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-2.5 h-2.5" /> : active ? <Activity className="w-2.5 h-2.5" /> : <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-500 inline-block" />}
                    {i + 1}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Events stream */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
            style={{ maxHeight: "280px" }}
          >
            {events.length === 0 && !isRunning ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Ready to simulate</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Click "Run Simulation" to watch the full 7-stage learning pipeline execute in real time.
                </p>
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs font-medium ${evt.color} animate-in`}
                >
                  <span className="mt-0.5 shrink-0">{evt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold">{evt.label}</span>
                      <span className="text-[9px] opacity-60 shrink-0 font-normal">
                        {evt.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 font-normal leading-snug mt-0.5">{evt.detail}</p>
                  </div>
                </div>
              ))
            )}
            {isRunning && (
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 px-2.5">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
                Processing stage {liveCount + 1} of {PIPELINE_STAGES.length}…
              </div>
            )}
            {!isRunning && liveCount === PIPELINE_STAGES.length && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                Pipeline complete — learning outcome measured!
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 p-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={startSimulation}
              disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Activity className="w-3.5 h-3.5" />
              {isRunning ? "Running…" : liveCount > 0 ? "Re-run Simulation" : "Run Simulation"}
            </button>
            {liveCount > 0 && !isRunning && (
              <button
                onClick={clearEvents}
                className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-medium cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
