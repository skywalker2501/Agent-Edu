"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  FileCode,
  Flame,
  Puzzle,
  Timer
} from "lucide-react";

// Safe Option Extractors to prevent React Object-as-Child rendering crashes
const getOptionKey = (opt: any, fallbackIdx: number): string => {
  if (typeof opt === "object" && opt !== null) {
    return String(opt.id || opt.key || opt.value || opt.text || fallbackIdx);
  }
  return String(opt ?? fallbackIdx);
};

const getOptionLabel = (opt: any): string => {
  if (typeof opt === "object" && opt !== null) {
    if (opt.text && opt.id && String(opt.id).length <= 2) {
      return `${opt.id}) ${opt.text}`;
    }
    return String(opt.text || opt.title || opt.label || opt.value || opt.id || "");
  }
  return String(opt ?? "");
};

const getOptionValue = (opt: any): string => {
  if (typeof opt === "object" && opt !== null) {
    return String(opt.id || opt.text || opt.value || "");
  }
  return String(opt ?? "");
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: string | null;
}
class GameErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || "Render error occurred." };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("GameErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 text-center border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Game Interface Recovered</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-4">
            A temporary display error occurred while loading this activity. Click below to refresh the round safely.
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })} className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reload Game
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default function LearnAndPlayPage() {
  const [activeTab, setActiveTab] = useState<
    "quiz" | "puzzle" | "quickfire" | "code" | "match" | "flashcards" | "adaptive"
  >("quiz");

  // User XP feedback banner
  const [sessionXpEarned, setSessionXpEarned] = useState<number>(0);
  const [lastRewardNotice, setLastRewardNotice] = useState<string | null>(null);

  // Game A: Quiz Battle State
  const [quizSession, setQuizSession] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Game B: Word Scramble & Code Puzzle State
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [currentPuzzleIdx, setCurrentPuzzleIdx] = useState<number>(0);
  const [puzzleInput, setPuzzleInput] = useState<string>("");
  const [puzzleHintsUsed, setPuzzleHintsUsed] = useState<number>(0);
  const [showPuzzleHint, setShowPuzzleHint] = useState<boolean>(false);
  const [puzzleResult, setPuzzleResult] = useState<any>(null);
  const [puzzleLoading, setPuzzleLoading] = useState<boolean>(false);

  // Game C: Speed Quickfire State
  const [quickfireQuestions] = useState<any[]>([
    {
      id: "qf-1",
      prompt: "What is the worst-case time complexity of standard QuickSort with poor pivot selection?",
      options: ["O(n log n)", "O(n²)", "O(log n)", "O(n)"],
      answer: "O(n²)"
    },
    {
      id: "qf-2",
      prompt: "Which data structure follows the LIFO (Last In First Out) principle used by recursive call stacks?",
      options: ["Queue", "Stack", "Binary Heap", "Hash Table"],
      answer: "Stack"
    },
    {
      id: "qf-3",
      prompt: "What is the height of a balanced Binary Search Tree containing N nodes?",
      options: ["O(1)", "O(log N)", "O(N)", "O(N²)"],
      answer: "O(log N)"
    },
    {
      id: "qf-4",
      prompt: "In dynamic programming, what technique converts top-down recursive calls into bottom-up array loops?",
      options: ["Memoization", "Tabulation", "Binary Search", "Divide & Conquer"],
      answer: "Tabulation"
    },
    {
      id: "qf-5",
      prompt: "What is the average time complexity to lookup a key in a well-distributed Hash Map?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      answer: "O(1)"
    }
  ]);
  const [quickfireActive, setQuickfireActive] = useState<boolean>(false);
  const [quickfireCurrentIdx, setQuickfireCurrentIdx] = useState<number>(0);
  const [quickfireCorrectCount, setQuickfireCorrectCount] = useState<number>(0);
  const [quickfireSelectedOpt, setQuickfireSelectedOpt] = useState<string | null>(null);
  const [quickfireFinished, setQuickfireFinished] = useState<boolean>(false);
  const [quickfireResult, setQuickfireResult] = useState<any>(null);

  // Game D: Concept Match State
  const [matchData, setMatchData] = useState<any>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Array<{ term_id: string; def_id: string }>>([]);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Game E: Code Quest State
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [studentCode, setStudentCode] = useState<string>("");
  const [codeExecution, setCodeExecution] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);

  // Game F: Flashcard Sprint State
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewStats, setReviewStats] = useState({ known: 0, uncertain: 0, not_understood: 0 });

  // Game G: Adaptive Challenge State
  const [adaptiveData, setAdaptiveData] = useState<any>(null);
  const [adaptiveSelectedOption, setAdaptiveSelectedOption] = useState<string | null>(null);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadCodeChallenges();
    loadFlashcards();
    loadAdaptiveChallenge();
    loadPuzzles();
  }, []);

  const triggerReward = (xp: number, label: string) => {
    setSessionXpEarned((prev) => prev + xp);
    setLastRewardNotice(`+${xp} XP Earned! ${label}`);
    setTimeout(() => setLastRewardNotice(null), 6000);
  };

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
      if (res?.xp_awarded > 0) {
        triggerReward(res.xp_awarded, "Quiz Battle Victory");
      }
    } catch (err) {
      console.error("Failed to submit quiz battle:", err);
    } finally {
      setQuizLoading(false);
    }
  };

  // --- Word Scramble & Code Puzzle Handlers ---
  const loadPuzzles = async () => {
    setPuzzleLoading(true);
    try {
      const list = await api.getWordPuzzles();
      setPuzzles(list || []);
      setCurrentPuzzleIdx(0);
      setPuzzleInput("");
      setShowPuzzleHint(false);
      setPuzzleResult(null);
    } catch (err) {
      console.error("Failed to load puzzles:", err);
    } finally {
      setPuzzleLoading(false);
    }
  };

  const handleRevealPuzzleHint = () => {
    setShowPuzzleHint(true);
    setPuzzleHintsUsed((prev) => prev + 1);
  };

  const handleSubmitWordPuzzle = async () => {
    const current = puzzles[currentPuzzleIdx];
    if (!current || !puzzleInput.trim()) return;
    setPuzzleLoading(true);
    try {
      const res = await api.submitWordPuzzle(current.id, puzzleInput, puzzleHintsUsed);
      setPuzzleResult(res);
      if (res.is_correct && res.xp_awarded > 0) {
        triggerReward(res.xp_awarded, "Puzzle Solved!");
      }
    } catch (err) {
      console.error("Failed to submit puzzle:", err);
    } finally {
      setPuzzleLoading(false);
    }
  };

  const handleNextPuzzle = () => {
    setPuzzleResult(null);
    setPuzzleInput("");
    setShowPuzzleHint(false);
    setPuzzleHintsUsed(0);
    setCurrentPuzzleIdx((prev) => (prev + 1) % Math.max(1, puzzles.length));
  };

  // --- Speed Quickfire Handlers ---
  const handleStartQuickfire = () => {
    setQuickfireActive(true);
    setQuickfireCurrentIdx(0);
    setQuickfireCorrectCount(0);
    setQuickfireSelectedOpt(null);
    setQuickfireFinished(false);
    setQuickfireResult(null);
  };

  const handleSelectQuickfireOption = (option: string) => {
    if (quickfireSelectedOpt) return;
    setQuickfireSelectedOpt(option);

    const currQ = quickfireQuestions[quickfireCurrentIdx];
    const isCorrect = option === currQ.answer;
    const newCorrect = isCorrect ? quickfireCorrectCount + 1 : quickfireCorrectCount;
    if (isCorrect) setQuickfireCorrectCount(newCorrect);

    setTimeout(async () => {
      if (quickfireCurrentIdx + 1 < quickfireQuestions.length) {
        setQuickfireCurrentIdx((prev) => prev + 1);
        setQuickfireSelectedOpt(null);
      } else {
        // Round completed
        setQuickfireFinished(true);
        try {
          const res = await api.submitQuickfire(
            newCorrect * 20,
            newCorrect,
            quickfireQuestions.length
          );
          setQuickfireResult(res);
          if (res?.xp_awarded > 0) {
            triggerReward(res.xp_awarded, "Speed Quickfire Complete!");
          }
        } catch (err) {
          console.error("Quickfire submit error:", err);
        }
      }
    }, 900);
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
        api.submitConceptMatch(updated).then((res) => {
          setMatchResult(res);
          if (res?.xp_awarded > 0) {
            triggerReward(res.xp_awarded, "Concept Match Completed!");
          }
        });
      }
    }
  };

  // --- Code Quest Handlers ---
  const loadCodeChallenges = async () => {
    try {
      const list = await api.getCodeChallenges();
      setChallenges(list || []);
      if (list && list.length > 0) {
        handleSelectChallenge(list[0].slug);
      }
    } catch (err) {
      console.error("Failed to load code challenges:", err);
    }
  };

  const handleSelectChallenge = async (slug: string) => {
    try {
      const detail = await api.getCodeChallenge(slug);
      setSelectedChallenge(detail);
      setStudentCode(detail.initial_code || "");
      setCodeExecution(null);
      setHintsRevealed(0);
    } catch (err) {
      console.error("Failed to load challenge details:", err);
    }
  };

  const handleExecuteCode = async () => {
    if (!selectedChallenge) return;
    setIsExecuting(true);
    setCodeExecution(null);
    try {
      const res = await api.executeCodeQuest(
        selectedChallenge.slug,
        studentCode,
        selectedChallenge.language
      );
      setCodeExecution(res);
    } catch (err) {
      console.error("Failed to execute code sandbox:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitChallenge = async () => {
    if (!selectedChallenge) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitCodeQuest(
        selectedChallenge.slug,
        studentCode,
        selectedChallenge.language
      );
      setCodeExecution(res);
      if (res?.xp_awarded > 0) {
        triggerReward(res.xp_awarded, `Code Quest Solved: ${selectedChallenge.title}`);
      }
    } catch (err) {
      console.error("Failed to submit challenge:", err);
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
      triggerReward(5, "Flashcard Reviewed");

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
      `Answer recorded. Your mastery evidence has been updated based on this ${adaptiveData?.difficulty_selected} challenge attempt (+20 XP).`
    );
    triggerReward(20, "Adaptive Diagnostic Challenge");
  };

  const currentPuzzle = puzzles[currentPuzzleIdx];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Syllabus-Linked Learning Games & Arcade
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Learn & Play Hub</h1>
          <p className="text-indigo-100/90 text-sm max-w-xl mt-1">
            Solve coding puzzles, word scrambles, timed quiz battles, and quickfire challenges to earn verified XP points displayed on the global leaderboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/student/leaderboard">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md">
              <Trophy className="w-4 h-4 mr-1.5 fill-slate-950" /> View Global Leaderboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Reward Toast / XP Bar */}
      {lastRewardNotice && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-indigo-500/10 border border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
            <span>{lastRewardNotice}</span>
          </div>
          <Link href="/student/leaderboard" className="underline hover:text-emerald-900 text-xs">
            Check Leaderboard Rank →
          </Link>
        </div>
      )}

      {/* Game Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { key: "quiz", label: "Quiz Battle", icon: Trophy },
          { key: "puzzle", label: "Word Scramble & Puzzle", icon: Puzzle },
          { key: "quickfire", label: "Speed Quickfire", icon: Zap },
          { key: "code", label: "Code Quest (Java / Python)", icon: Code2 },
          { key: "match", label: "Concept Match", icon: Sparkles },
          { key: "flashcards", label: "Flashcard Sprint", icon: Clock },
          { key: "adaptive", label: "Adaptive Challenge", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <GameErrorBoundary>
      {/* ============================================================= */}
      {/* GAME A: QUIZ BATTLE */}
      {/* ============================================================= */}
      {activeTab === "quiz" && (
        <div className="space-y-6">
          {!quizSession && !quizResult && (
            <Card className="text-center py-12 px-4 border-dashed border-2">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Ready for a Quiz Battle?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                Answer 5 syllabus-linked questions against the clock. Earn +15 XP for every correct answer, plus speed and accuracy streak bonuses!
              </p>
              <Button onClick={handleStartQuiz} disabled={quizLoading} size="lg" className="bg-indigo-600 hover:bg-indigo-700 font-bold">
                {quizLoading ? "Loading Questions..." : "Start Quiz Battle"}
              </Button>
            </Card>
          )}

          {quizSession && !quizResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900">
                <span className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> Timed Round: 5 Questions
                </span>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
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
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">{q.title}</CardTitle>
                      <CardDescription className="text-sm text-slate-700 dark:text-slate-300">{q.prompt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(Array.isArray(q.options) ? q.options : ["True", "False"]).map((opt: any, optIdx: number) => {
                          const optVal = getOptionValue(opt);
                          const optKey = getOptionKey(opt, optIdx);
                          const optLabel = getOptionLabel(opt);
                          const isSelected = quizAnswers[q.id] === optVal || quizAnswers[q.id] === optKey;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectQuizAnswer(q.id, optVal)}
                              className={`p-3 rounded-lg text-left text-sm font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold ring-2 ring-indigo-500/20"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                              }`}
                            >
                              {optLabel}
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
                  {quizLoading ? "Grading..." : "Submit Answers (+XP)"}
                </Button>
              </div>
            </div>
          )}

          {quizResult && (
            <Card className="p-6 text-center border-emerald-200 bg-emerald-50/20 dark:bg-emerald-950/20">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Battle Completed!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                You answered {quizResult.correct_count} of {quizResult.total_questions} questions correctly (
                {Math.round(quizResult.accuracy * 100)}% accuracy).
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-full font-bold text-lg mb-6">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                +{quizResult.xp_awarded} XP Earned
              </div>

              <div className="flex justify-center gap-3">
                <Button onClick={handleStartQuiz} className="bg-indigo-600 hover:bg-indigo-700">
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Another Round
                </Button>
                <Link href="/student/leaderboard">
                  <Button variant="outline">
                    <Trophy className="w-4 h-4 mr-2" /> View Leaderboard
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME B: WORD SCRAMBLE & CONCEPT PUZZLE */}
      {/* ============================================================= */}
      {activeTab === "puzzle" && (
        <div className="space-y-6">
          <Card className="border-indigo-100 dark:border-indigo-900">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Puzzle {currentPuzzleIdx + 1} of {puzzles.length || 5}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Category: {currentPuzzle?.category || "Computer Science"}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                  Unscramble the Concept
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Rearrange the jumbled letters to identify the computer science concept. Earn up to +30 XP!
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPuzzle}
                className="text-xs"
              >
                Skip / Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              {currentPuzzle ? (
                <>
                  {/* Scrambled Letter Tiles */}
                  <div className="py-6 px-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-2">
                    {(currentPuzzle.scrambled || currentPuzzle.answer || "").split("").map((letter: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-11 h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700 shadow-sm flex items-center justify-center text-xl font-extrabold text-indigo-900 dark:text-indigo-200 select-none animate-in zoom-in-50"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>

                  {/* Hint Section */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Word Length: <strong>{currentPuzzle.length || currentPuzzle.answer?.length || currentPuzzle.scrambled?.length || 0} letters</strong>
                    </span>
                    {!showPuzzleHint ? (
                      <button
                        onClick={handleRevealPuzzleHint}
                        className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                      >
                        <Lightbulb className="w-3.5 h-3.5" /> Reveal Hint (-5 XP penalty)
                      </button>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                        💡 Hint: {currentPuzzle.hint}
                      </span>
                    )}
                  </div>

                  {/* Submission Form */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      placeholder="Type your unscrambled answer here..."
                      value={puzzleInput}
                      onChange={(e) => setPuzzleInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmitWordPuzzle();
                      }}
                      className="flex-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button
                      onClick={handleSubmitWordPuzzle}
                      disabled={puzzleLoading || !puzzleInput.trim()}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 font-bold text-xs sm:text-sm"
                    >
                      {puzzleLoading ? "Verifying..." : "Submit Answer"}
                    </Button>
                  </div>

                  {/* Puzzle Outcome Result */}
                  {puzzleResult && (
                    <div
                      className={`p-4 rounded-xl border text-sm flex items-start justify-between gap-3 ${
                        puzzleResult.is_correct
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200"
                          : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-900 dark:text-rose-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          {puzzleResult.is_correct ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct! +{puzzleResult.xp_awarded} XP Earned
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-rose-600" /> Not quite right. Keep trying!
                            </>
                          )}
                        </div>
                        <p className="text-xs mt-1 opacity-90">{puzzleResult.explanation}</p>
                      </div>

                      {puzzleResult.is_correct && (
                        <Button
                          size="sm"
                          onClick={handleNextPuzzle}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0"
                        >
                          Next Puzzle <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={loadPuzzles}>Load Puzzles</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME C: SPEED COMPLEXITY & LOGIC QUICKFIRE */}
      {/* ============================================================= */}
      {activeTab === "quickfire" && (
        <div className="space-y-6">
          {!quickfireActive && !quickfireFinished && (
            <Card className="text-center py-12 px-4 border-dashed border-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Algorithmic Complexity Quickfire
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                5 rapid-fire questions testing algorithm Big-O complexities and memory invariants. Earn +12 XP per correct answer!
              </p>
              <Button onClick={handleStartQuickfire} size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                <Play className="w-4 h-4 mr-1.5 fill-white" /> Start Quickfire
              </Button>
            </Card>
          )}

          {quickfireActive && !quickfireFinished && (
            <Card className="border-indigo-100 dark:border-indigo-900">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    Question {quickfireCurrentIdx + 1} of {quickfireQuestions.length}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Score: {quickfireCorrectCount} Correct
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {quickfireQuestions[quickfireCurrentIdx].prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Array.isArray(quickfireQuestions[quickfireCurrentIdx]?.options)
                    ? quickfireQuestions[quickfireCurrentIdx].options
                    : []
                  ).map((opt: any, idx: number) => {
                    const optVal = getOptionValue(opt);
                    const optLabel = getOptionLabel(opt);
                    const isSelected = quickfireSelectedOpt === optVal;
                    const isAnswer = optVal === quickfireQuestions[quickfireCurrentIdx]?.answer;

                    let btnStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700";
                    if (quickfireSelectedOpt) {
                      if (isAnswer) {
                        btnStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold";
                      } else if (isSelected) {
                        btnStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 font-bold";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectQuickfireOption(optVal)}
                        disabled={!!quickfireSelectedOpt}
                        className={`p-4 rounded-xl border text-left font-bold text-sm transition-all cursor-pointer ${btnStyle}`}
                      >
                        {optLabel}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {quickfireFinished && (
            <Card className="p-6 text-center border-amber-200 bg-amber-50/20 dark:bg-amber-950/20">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 mx-auto flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Quickfire Finished!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                You got {quickfireCorrectCount} out of {quickfireQuestions.length} correct in the lightning round!
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full font-bold text-lg mb-6">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                +{quickfireResult?.xp_awarded ?? quickfireCorrectCount * 12} XP Earned
              </div>

              <div className="flex justify-center gap-3">
                <Button onClick={handleStartQuickfire} className="bg-amber-600 hover:bg-amber-700 text-white">
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                </Button>
                <Link href="/student/leaderboard">
                  <Button variant="outline">
                    <Trophy className="w-4 h-4 mr-2" /> View Leaderboard
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME D: CODE QUEST */}
      {/* ============================================================= */}
      {activeTab === "code" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Available Challenges
            </h3>
            <div className="space-y-2">
              {challenges.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectChallenge(c.slug)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedChallenge?.slug === c.slug
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 shadow-sm"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="uppercase text-[10px] font-bold">
                      {c.language}
                    </Badge>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">+{c.xp_reward} XP</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{c.problem_statement}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedChallenge ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize text-xs">
                      {selectedChallenge.difficulty}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">
                      Reward: <strong>+{selectedChallenge.xp_reward} XP</strong>
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedChallenge.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedChallenge.problem_statement}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Code Editor ({selectedChallenge.language})
                    </label>
                    <textarea
                      rows={12}
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      className="w-full font-mono text-xs sm:text-sm p-4 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setHintsRevealed((prev) => Math.min(prev + 1, selectedChallenge.hints?.length || 0))}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-500" />
                        Hint ({hintsRevealed}/{selectedChallenge.hints?.length || 0})
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleExecuteCode}
                        disabled={isExecuting}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {isExecuting ? "Running..." : "Run Test Cases"}
                      </Button>
                      <Button
                        onClick={handleSubmitChallenge}
                        disabled={isSubmitting}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Solution (+XP)"}
                      </Button>
                    </div>
                  </div>

                  {hintsRevealed > 0 && selectedChallenge.hints && (
                    <div className="space-y-1 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                      <span className="font-bold flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5" /> Hints:
                      </span>
                      {selectedChallenge.hints.slice(0, hintsRevealed).map((h: string, idx: number) => (
                        <p key={idx} className="pl-4">• {h}</p>
                      ))}
                    </div>
                  )}

                  {codeExecution && (
                    <div
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        codeExecution.passed
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200"
                          : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-900 dark:text-rose-200"
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>
                          {codeExecution.passed
                            ? "✓ All Test Cases Passed!"
                            : "✗ Some Tests Failed"}
                        </span>
                        <span>
                          {codeExecution.tests_passed} / {codeExecution.tests_total} Tests
                        </span>
                      </div>
                      {codeExecution.output && (
                        <pre className="p-2 bg-slate-900 text-slate-100 rounded text-[11px] overflow-x-auto">
                          {codeExecution.output}
                        </pre>
                      )}
                      {codeExecution.error && (
                        <p className="font-mono text-rose-600 dark:text-rose-400">{codeExecution.error}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center py-12">
                <CardContent>Select a challenge to begin coding.</CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME E: CONCEPT MATCH */}
      {/* ============================================================= */}
      {activeTab === "match" && (
        <div className="space-y-6">
          {!matchData && (
            <Card className="text-center py-12 px-4 border-dashed border-2">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 mx-auto flex items-center justify-center mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Concept Match Memory Challenge</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                Pair programming terms with their correct definitions. Match all pairs accurately to earn XP!
              </p>
              <Button onClick={handleStartMatch} size="lg" className="bg-violet-600 hover:bg-violet-700 font-bold">
                Start Concept Match
              </Button>
            </Card>
          )}

          {matchData && !matchResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Terms & Concepts
                </h3>
                {(matchData?.terms || []).map((t: any) => {
                  const isMatched = matchedPairs.some((p) => p.term_id === t.id);
                  const isSelected = selectedTerm === t.id;
                  return (
                    <button
                      key={t.id}
                      disabled={isMatched}
                      onClick={() => handlePairSelection(t.id, undefined)}
                      className={`w-full p-4 rounded-xl text-left text-sm font-bold border transition-all cursor-pointer ${
                        isMatched
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300 opacity-60 line-through"
                          : isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {t.text}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Definitions & Invariants
                </h3>
                {(matchData?.definitions || []).map((d: any) => {
                  const isMatched = matchedPairs.some((p) => p.def_id === d.id);
                  const isSelected = selectedDef === d.id;
                  return (
                    <button
                      key={d.id}
                      disabled={isMatched}
                      onClick={() => handlePairSelection(undefined, d.id)}
                      className={`w-full p-4 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                        isMatched
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300 opacity-60"
                          : isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {d.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {matchResult && (
            <Card className="p-6 text-center border-violet-200 bg-violet-50/20 dark:bg-violet-950/20">
              <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-600 mx-auto flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Match Completed!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                You matched {matchResult.correct_matches} of {matchResult.total_pairs} pairs correctly.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 rounded-full font-bold text-lg mb-6">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                +{matchResult.xp_awarded} XP Earned
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={handleStartMatch} className="bg-violet-600 hover:bg-violet-700">
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                </Button>
                <Link href="/student/leaderboard">
                  <Button variant="outline">View Leaderboard</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME F: FLASHCARD SPRINT */}
      {/* ============================================================= */}
      {activeTab === "flashcards" && (
        <div className="max-w-xl mx-auto space-y-6">
          {flashcards.length > 0 && currentCardIndex < flashcards.length ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Card {currentCardIndex + 1} of {flashcards.length}
                </span>
                <span className="font-semibold capitalize text-indigo-600">
                  {flashcards[currentCardIndex].card_type}
                </span>
              </div>

              <div
                onClick={() => setIsFlipped((prev) => !prev)}
                className="min-h-64 p-8 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 shadow-md flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-indigo-400 select-none"
              >
                {!isFlipped ? (
                  <>
                    <span className="text-xs font-bold text-indigo-600 uppercase mb-4">Prompt</span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                      {flashcards[currentCardIndex].front_prompt}
                    </h3>
                    <p className="text-xs text-slate-400 mt-6">Click card to reveal answer</p>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-emerald-600 uppercase mb-4">Solution & Explanation</span>
                    <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {flashcards[currentCardIndex].back_solution}
                    </p>
                  </>
                )}
              </div>

              {isFlipped && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Button
                    onClick={() => handleRateFlashcard("not_understood")}
                    variant="outline"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs"
                  >
                    Not Understood
                  </Button>
                  <Button
                    onClick={() => handleRateFlashcard("uncertain")}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                  >
                    Uncertain
                  </Button>
                  <Button
                    onClick={() => handleRateFlashcard("known")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Mastered (+5 XP)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">All Flashcards Reviewed!</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">You have reviewed all due cards for this session.</p>
              <Button onClick={loadFlashcards} variant="outline" size="sm">
                Restart Deck
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* GAME G: ADAPTIVE CHALLENGE */}
      {/* ============================================================= */}
      {activeTab === "adaptive" && (
        <div className="max-w-2xl mx-auto space-y-4">
          {adaptiveData ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="capitalize text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800">
                    {adaptiveData.difficulty_selected} Challenge
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Topic Mastery: {Math.round((adaptiveData.current_mastery_score || 0.5) * 100)}%
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {adaptiveData.question?.title || "Concept Mastery Assessment"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                  {adaptiveData.pedagogical_reason}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {adaptiveData.question?.prompt}
                </p>

                <div className="space-y-2">
                  {(Array.isArray(adaptiveData.question?.options) ? adaptiveData.question.options : []).map((opt: any, idx: number) => {
                    const optVal = getOptionValue(opt);
                    const optLabel = getOptionLabel(opt);
                    const isSelected = adaptiveSelectedOption === optVal;
                    return (
                      <button
                        key={idx}
                        onClick={() => setAdaptiveSelectedOption(optVal)}
                        className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold ring-2 ring-indigo-500/20"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        {optLabel}
                      </button>
                    );
                  })}
                </div>

                {adaptiveFeedback && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                    {adaptiveFeedback}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    onClick={handleAdaptiveSubmit}
                    disabled={!adaptiveSelectedOption}
                    className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
                  >
                    Record Answer (+20 XP)
                  </Button>
                  <Button onClick={loadAdaptiveChallenge} variant="outline" className="text-xs font-semibold">
                    Next Adaptive Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12 px-4 border-dashed border-2">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Loading Adaptive Challenge</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                Analyzing your misconception profile and topic mastery to select the ideal difficulty level.
              </p>
              <Button onClick={loadAdaptiveChallenge} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs">
                Fetch Challenge
              </Button>
            </Card>
          )}
        </div>
      )}
      </GameErrorBoundary>
    </div>
  );
}
