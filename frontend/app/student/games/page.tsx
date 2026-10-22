"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Code2,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
  Zap,
  HelpCircle,
  FileCode
} from "lucide-react";

export default function LearnAndPlayPage() {
  const [activeTab, setActiveTab] = useState<"quiz" | "match" | "code" | "flashcards" | "adaptive">("quiz");

  // Game A: Quiz Battle State
  const [quizSession, setQuizSession] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Game B: Concept Match State
  const [matchData, setMatchData] = useState<any>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Array<{ term_id: string; def_id: string }>>([]);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Game C: Code Quest State
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [studentCode, setStudentCode] = useState<string>("");
  const [codeExecution, setCodeExecution] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);

  // Game D: Flashcard Sprint State
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewStats, setReviewStats] = useState({ known: 0, uncertain: 0, not_understood: 0 });

  // Game E: Adaptive Challenge State
  const [adaptiveData, setAdaptiveData] = useState<any>(null);
  const [adaptiveSelectedOption, setAdaptiveSelectedOption] = useState<string | null>(null);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadCodeChallenges();
    loadFlashcards();
    loadAdaptiveChallenge();
  }, []);

  // --- Quiz Battle Handlers ---
  const handleStartQuiz = async () => {
    setQuizLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    try {
      const data = await api.startQuizBattle();
      setQuizSession(data);
    } catch (err) {
      console.error("Failed to start quiz battle:", err);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectQuizAnswer = (questionId: string, option: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizSession) return;
    setQuizLoading(true);
    try {
      const res = await api.submitQuizBattle(quizSession.session_id, quizAnswers, 45);
      setQuizResult(res);
    } catch (err) {
      console.error("Failed to submit quiz battle:", err);
    } finally {
      setQuizLoading(false);
    }
  };

  // --- Concept Match Handlers ---
  const handleStartMatch = async () => {
    try {
      const data = await api.getConceptMatch();
      setMatchData(data);
      setMatchedPairs([]);
      setMatchResult(null);
      setSelectedTerm(null);
      setSelectedDef(null);
    } catch (err) {
      console.error("Failed to load concept match:", err);
    }
  };

  const handlePairSelection = (termId?: string, defId?: string) => {
    if (termId) setSelectedTerm(termId);
    if (defId) setSelectedDef(defId);

    const activeT = termId || selectedTerm;
    const activeD = defId || selectedDef;

    if (activeT && activeD) {
      const newPair = { term_id: activeT, def_id: activeD };
      const updated = [...matchedPairs, newPair];
      setMatchedPairs(updated);
      setSelectedTerm(null);
      setSelectedDef(null);

      if (matchData && updated.length === matchData.pair_count) {
        api.submitConceptMatch(updated).then((res) => setMatchResult(res));
      }
    }
  };

  // --- Code Quest Handlers ---
  const loadCodeChallenges = async () => {
    try {
      const list = await api.getCodeChallenges();
      setChallenges(list);
      if (list.length > 0) {
        loadSpecificChallenge(list[0].slug);
      }
    } catch (err) {
      console.error("Failed to load code challenges:", err);
    }
  };

  const loadSpecificChallenge = async (slug: string) => {
    try {
      const c = await api.getCodeChallenge(slug);
      setSelectedChallenge(c);
      setStudentCode(c.initial_code || "");
      setCodeExecution(null);
      setHintsRevealed(0);
    } catch (err) {
      console.error("Failed to load challenge:", err);
    }
  };

  const handleRunCode = async () => {
    if (!selectedChallenge) return;
    setIsExecuting(true);
    try {
      const res = await api.executeCodeQuest(selectedChallenge.slug, studentCode, selectedChallenge.language);
      setCodeExecution(res);
    } catch (err: any) {
      setCodeExecution({ passed: false, error: err.message || "Execution failed" });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!selectedChallenge) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitCodeQuest(selectedChallenge.slug, studentCode, selectedChallenge.language);
      setCodeExecution(res);
    } catch (err: any) {
      setCodeExecution({ passed: false, error: err.message || "Submission failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Flashcard Handlers ---
  const loadFlashcards = async () => {
    try {
      const data = await api.getDueFlashcards();
      setFlashcards(data.flashcards || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    }
  };

  const handleRateFlashcard = async (rating: "known" | "uncertain" | "not_understood") => {
    const card = flashcards[currentCardIndex];
    if (!card) return;

    try {
      await api.reviewFlashcard(card.id, rating);
      setReviewStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

      if (currentCardIndex + 1 < flashcards.length) {
        setCurrentCardIndex((prev) => prev + 1);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error("Failed to record card review:", err);
    }
  };

  // --- Adaptive Challenge Handlers ---
  const loadAdaptiveChallenge = async () => {
    try {
      const data = await api.getAdaptiveChallengeNext();
      setAdaptiveData(data);
      setAdaptiveSelectedOption(null);
      setAdaptiveFeedback(null);
    } catch (err) {
      console.error("Failed to load adaptive challenge:", err);
    }
  };

  const handleAdaptiveSubmit = () => {
    if (!adaptiveSelectedOption) return;
    setAdaptiveFeedback(
      `Answer recorded. Your mastery evidence has been updated based on this ${adaptiveData?.difficulty_selected} challenge attempt.`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Syllabus-Linked Learning Games
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Learn & Play Hub</h1>
          <p className="text-indigo-100/90 text-sm max-w-xl mt-1">
            Solve programming puzzles, compete in timed quiz battles, and practice spaced repetition to earn verified XP points.
          </p>
        </div>
      </div>

      {/* Game Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { key: "quiz", label: "Quiz Battle", icon: Trophy },
          { key: "code", label: "Code Quest (Java / Python)", icon: Code2 },
          { key: "match", label: "Concept Match", icon: Zap },
          { key: "flashcards", label: "Flashcard Sprint", icon: Clock },
          { key: "adaptive", label: "Adaptive Challenge", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================= */}
      {/* GAME A: QUIZ BATTLE */}
      {/* ============================================================= */}
      {activeTab === "quiz" && (
        <div className="space-y-6">
          {!quizSession && !quizResult && (
            <Card className="text-center py-12 px-4 border-dashed border-2">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ready for a Quiz Battle?</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Answer 5 syllabus-linked questions against the clock. Earn +15 XP for every correct answer, plus speed and accuracy streak bonuses!
              </p>
              <Button onClick={handleStartQuiz} disabled={quizLoading} size="lg" className="bg-indigo-600 hover:bg-indigo-700 font-bold">
                {quizLoading ? "Loading Questions..." : "Start Quiz Battle"}
              </Button>
            </Card>
          )}

          {quizSession && !quizResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <span className="font-bold text-sm text-indigo-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> Timed Round: 5 Questions
                </span>
                <span className="text-xs font-semibold text-indigo-700">
                  {Object.keys(quizAnswers).length} / {quizSession.questions.length} Answered
                </span>
              </div>

              <div className="space-y-4">
                {quizSession.questions.map((q: any, idx: number) => (
                  <Card key={q.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 uppercase">Question {idx + 1}</span>
                        <Badge variant="outline" className="capitalize text-xs">{q.difficulty}</Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-slate-900">{q.title}</CardTitle>
                      <CardDescription className="text-sm text-slate-700">{q.prompt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isSelected = quizAnswers[q.id] === opt;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectQuizAnswer(q.id, opt)}
                              className={`p-3 rounded-lg text-left text-sm font-medium border transition-all ${
                                isSelected
                                  ? "bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/20"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={quizLoading || Object.keys(quizAnswers).length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  size="lg"
                >
                  Submit & Verify Answers
                </Button>
              </div>
            </div>
          )}

          {quizResult && (
            <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/20">
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Battle Complete!</CardTitle>
                <CardDescription className="text-sm text-emerald-800 font-semibold">
                  You scored {quizResult.score} points and earned +{quizResult.xp_awarded} XP!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500">Correct</p>
                    <p className="text-xl font-bold text-slate-900">{quizResult.correct_count} / {quizResult.total_questions}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500">Accuracy</p>
                    <p className="text-xl font-bold text-slate-900">{Math.round(quizResult.accuracy * 100)}%</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500">XP Awarded</p>
                    <p className="text-xl font-bold text-emerald-600">+{quizResult.xp_awarded} XP</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 pt-3">
                  {quizResult.breakdown?.map((b: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{b.title}</p>
                        <p className="text-slate-500">Your Answer: <span className={b.is_correct ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{b.user_answer}</span></p>
                      </div>
                      <Badge variant={b.is_correct ? "default" : "destructive"}>
                        {b.is_correct ? "Correct" : "Incorrect"}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="pt-4 text-center">
                  <Button onClick={handleStartQuiz} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
                    Play Another Round
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME B: CONCEPT MATCH */}
      {/* ============================================================= */}
      {activeTab === "match" && (
        <div className="space-y-6">
          {!matchData && !matchResult && (
            <Card className="text-center py-12 px-4 border-dashed border-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Concept Match</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Match data structure concepts and asymptotic complexities with their exact definitions. Test your recall speed!
              </p>
              <Button onClick={handleStartMatch} size="lg" className="bg-amber-600 hover:bg-amber-700 font-bold">
                Start Concept Match
              </Button>
            </Card>
          )}

          {matchData && !matchResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-amber-900">
                  Select a Term on the left, then click its matching Definition on the right.
                </span>
                <span className="text-xs font-bold text-amber-700">
                  Matched: {matchedPairs.length} / {matchData.pair_count}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Terms column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concept Terms</h4>
                  {matchData.terms.map((t: any) => {
                    const isMatched = matchedPairs.some((p) => p.term_id === t.id);
                    const isSelected = selectedTerm === t.id;
                    return (
                      <button
                        key={t.id}
                        disabled={isMatched}
                        onClick={() => handlePairSelection(t.id, undefined)}
                        className={`w-full p-4 rounded-xl text-left text-sm font-semibold border transition-all ${
                          isMatched
                            ? "bg-slate-100 text-slate-400 border-slate-200 line-through"
                            : isSelected
                            ? "bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-sm"
                            : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        {t.text}
                      </button>
                    );
                  })}
                </div>

                {/* Definitions column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Definitions & Invariants</h4>
                  {matchData.definitions.map((d: any) => {
                    const isMatched = matchedPairs.some((p) => p.def_id === d.id);
                    const isSelected = selectedDef === d.id;
                    return (
                      <button
                        key={d.id}
                        disabled={isMatched}
                        onClick={() => handlePairSelection(undefined, d.id)}
                        className={`w-full p-4 rounded-xl text-left text-sm font-medium border transition-all ${
                          isMatched
                            ? "bg-slate-100 text-slate-400 border-slate-200 line-through"
                            : isSelected
                            ? "bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-sm"
                            : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        {d.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {matchResult && (
            <Card className="text-center py-8 border-amber-200 bg-amber-50/20">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-2 shadow-sm">
                  <Award className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Match Completed!</CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  You matched {matchResult.correct_matches} / {matchResult.total_pairs} correctly and earned +{matchResult.xp_awarded} XP!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleStartMatch} className="bg-amber-600 hover:bg-amber-700 font-bold">
                  Play Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME C: CODE QUEST (Java & Python Sandbox) */}
      {/* ============================================================= */}
      {activeTab === "code" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenges List Sidebar */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Programming Challenge</h3>
            <div className="space-y-2">
              {challenges.map((c) => {
                const isSelected = selectedChallenge?.slug === c.slug;
                return (
                  <button
                    key={c.slug}
                    onClick={() => loadSpecificChallenge(c.slug)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-500/20 font-bold shadow-sm"
                        : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {c.language}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold">+{c.xp_reward} XP</span>
                    </div>
                    <p className="text-sm font-semibold truncate">{c.title}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Editor & Problem Workspace */}
          {selectedChallenge && (
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="uppercase font-bold text-xs">{selectedChallenge.language} 24 Sandbox</Badge>
                    <span className="text-xs text-slate-500 font-medium capitalize">{selectedChallenge.difficulty}</span>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900">{selectedChallenge.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-700 leading-relaxed">
                    {selectedChallenge.problem_statement}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Code Editor Area */}
                  <div>
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 text-slate-300 text-xs font-mono rounded-t-lg">
                      <span>{selectedChallenge.language === "java" ? "Solution.java" : "solution.py"}</span>
                      <span className="text-slate-400">Isolated JVM Sandbox</span>
                    </div>
                    <textarea
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      rows={14}
                      className="w-full font-mono text-xs p-3.5 bg-slate-950 text-emerald-400 rounded-b-lg border-x border-b border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Actions & Hint Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {selectedChallenge.hints?.length > 0 && hintsRevealed < selectedChallenge.hints.length && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHintsRevealed((prev) => prev + 1)}
                          className="text-xs text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
                        >
                          <Lightbulb className="w-3.5 h-3.5 mr-1" /> Get Hint ({hintsRevealed}/{selectedChallenge.hints.length})
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRunCode}
                        disabled={isExecuting || isSubmitting}
                        className="text-xs font-semibold"
                      >
                        {isExecuting ? "Compiling..." : "Test Sandbox Run"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmitCode}
                        disabled={isExecuting || isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        {isSubmitting ? "Evaluating..." : "Submit for XP"}
                      </Button>
                    </div>
                  </div>

                  {/* Progressive Hints */}
                  {hintsRevealed > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <span className="font-bold">Progressive Clue:</span>
                      <p>{selectedChallenge.hints[hintsRevealed - 1]}</p>
                    </div>
                  )}

                  {/* Execution Output Box */}
                  {codeExecution && (
                    <div className={`p-4 rounded-xl border text-xs font-mono ${
                      codeExecution.passed ? "bg-emerald-50 border-emerald-300 text-emerald-950" : "bg-rose-50 border-rose-300 text-rose-950"
                    }`}>
                      <div className="flex items-center justify-between mb-2 font-bold font-sans">
                        <span className="flex items-center gap-1.5">
                          {codeExecution.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                          {codeExecution.passed ? "Verification Passed!" : "Execution Issues Detected"}
                        </span>
                        {codeExecution.xp_awarded > 0 && (
                          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                            +{codeExecution.xp_awarded} XP Awarded!
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{codeExecution.output || codeExecution.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME D: FLASHCARD SPRINT */}
      {/* ============================================================= */}
      {activeTab === "flashcards" && (
        <div className="max-w-2xl mx-auto space-y-6">
          {flashcards.length > 0 && currentCardIndex < flashcards.length ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
                <span>Spaced Repetition Review</span>
              </div>

              {/* Flashcard Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer min-h-[220px] p-8 rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase">
                    {isFlipped ? "Solution & Invariant" : "Prompt / Question"}
                  </span>
                  <p className="text-base sm:text-lg font-bold text-slate-900 mt-4 leading-relaxed">
                    {isFlipped ? flashcards[currentCardIndex].back_solution : flashcards[currentCardIndex].front_prompt}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 text-center italic mt-4">
                  (Click card to {isFlipped ? "show prompt" : "reveal answer"})
                </p>
              </div>

              {/* Leitner Rating Buttons */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <Button
                  onClick={() => handleRateFlashcard("not_understood")}
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs"
                >
                  Need Review (1d)
                </Button>
                <Button
                  onClick={() => handleRateFlashcard("uncertain")}
                  variant="outline"
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold text-xs"
                >
                  Uncertain (3d)
                </Button>
                <Button
                  onClick={() => handleRateFlashcard("known")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                >
                  Mastered (7d)
                </Button>
              </div>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <CardTitle className="text-lg font-bold text-slate-900">Sprint Completed!</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                All scheduled flashcards for today have been reviewed. Next intervals calculated via SM-2.
              </CardDescription>
              <Button onClick={loadFlashcards} className="mt-4 bg-indigo-600 font-bold" size="sm">
                Refresh Deck
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME E: ADAPTIVE CHALLENGE */}
      {/* ============================================================= */}
      {activeTab === "adaptive" && adaptiveData && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize text-xs font-bold text-indigo-700">
                  {adaptiveData.difficulty_selected} Challenge
                </Badge>
                <span className="text-xs text-slate-500">
                  Topic Mastery: {Math.round(adaptiveData.current_mastery_score * 100)}%
                </span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900">{adaptiveData.question.title}</CardTitle>
              <CardDescription className="text-xs text-slate-600">{adaptiveData.pedagogical_reason}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-semibold text-slate-900">{adaptiveData.question.prompt}</p>

              <div className="space-y-2">
                {adaptiveData.question.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setAdaptiveSelectedOption(opt)}
                    className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-all ${
                      adaptiveSelectedOption === opt
                        ? "bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {adaptiveFeedback && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  {adaptiveFeedback}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={handleAdaptiveSubmit}
                  disabled={!adaptiveSelectedOption}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
                >
                  Record Answer
                </Button>
                <Button onClick={loadAdaptiveChallenge} variant="outline" className="text-xs font-semibold">
                  Next Adaptive Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
