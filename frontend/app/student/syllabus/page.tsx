"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Code2,
  Gamepad2,
  HelpCircle,
  Layers,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

interface LearningObjective {
  id: string;
  description: string;
  bloom_level: string;
}

interface Concept {
  id: string;
  code: string;
  name: string;
  difficulty: number;
}

interface Topic {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  learning_objectives: LearningObjective[];
  concepts: Concept[];
}

interface Chapter {
  id: string;
  title: string;
  order_index: number;
  topics: Topic[];
}

interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  chapters: Chapter[];
}

export default function SyllabusPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCourses();
      if (data && data.length > 0) {
        setCourses(data);
        setSelectedCourseId(data[0].id);
        // Expand first chapter by default
        if (data[0].chapters?.length > 0) {
          setExpandedChapters({ [data[0].chapters[0].id]: true });
          if (data[0].chapters[0].topics?.length > 0) {
            setExpandedTopics({ [data[0].chapters[0].topics[0].id]: true });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load courses hierarchy:", err);
      // Fallback syllabus data
      const fallback: Course[] = [
        {
          id: "cs-dsa-101",
          code: "CS-DSA-101",
          title: "Data Structures & Algorithms in Java & Python",
          description: "Foundational data structures, algorithmic complexity, recursion, and dynamic programming.",
          chapters: [
            {
              id: "ch-1",
              title: "Unit 1: Linear Data Structures & Pointer Arithmetic",
              order_index: 1,
              topics: [
                {
                  id: "t-arrays",
                  code: "DSA-ARR",
                  name: "Arrays & Dynamic Lists",
                  category: "Linear Data Structures",
                  description: "Memory layout, contiguous allocation, cache locality, and two-pointer traversal.",
                  learning_objectives: [
                    { id: "lo-1", description: "Explain contiguous memory allocation and cache locality of arrays.", bloom_level: "Understand" },
                    { id: "lo-2", description: "Implement two-pointer and sliding-window techniques with O(n) time.", bloom_level: "Apply" },
                    { id: "lo-3", description: "Analyze the amortized time complexity of dynamic array resizing.", bloom_level: "Analyze" },
                  ],
                  concepts: [
                    { id: "c-1", code: "ARR_MEM", name: "Contiguous Memory & Cache Locality", difficulty: 1 },
                    { id: "c-2", code: "TWO_PTR", name: "Two Pointers Technique", difficulty: 2 },
                  ],
                },
                {
                  id: "t-stacks",
                  code: "DSA-STK",
                  name: "Stacks & Call Frames",
                  category: "Linear Data Structures",
                  description: "LIFO semantics, call-stack representation, and balanced delimiter evaluation.",
                  learning_objectives: [
                    { id: "lo-4", description: "Trace stack call frames during recursive executions.", bloom_level: "Analyze" },
                    { id: "lo-5", description: "Design a monotonic stack to solve Next Greater Element in O(n).", bloom_level: "Create" },
                  ],
                  concepts: [
                    { id: "c-3", code: "LIFO_SEM", name: "LIFO Invariant", difficulty: 1 },
                    { id: "c-4", code: "MONO_STK", name: "Monotonic Stack", difficulty: 3 },
                  ],
                },
              ],
            },
            {
              id: "ch-2",
              title: "Unit 2: Hierarchical Structures & Binary Trees",
              order_index: 2,
              topics: [
                {
                  id: "t-trees",
                  code: "DSA-TREE",
                  name: "Trees & Binary Search Trees",
                  category: "Non-Linear Data Structures",
                  description: "Rooted hierarchical trees, BST properties, recursive traversals, and balance factors.",
                  learning_objectives: [
                    { id: "lo-6", description: "Prove BST invariant: left subtree < node < right subtree.", bloom_level: "Understand" },
                    { id: "lo-7", description: "Perform Pre-order, In-order, and Post-order traversals iteratively.", bloom_level: "Apply" },
                  ],
                  concepts: [
                    { id: "c-5", code: "BST_PROP", name: "BST Property", difficulty: 2 },
                    { id: "c-6", code: "TREE_TRAV", name: "In-Order / Post-Order Traversal", difficulty: 2 },
                  ],
                },
              ],
            },
          ],
        },
      ];
      setCourses(fallback);
      setSelectedCourseId(fallback[0].id);
      setExpandedChapters({ [fallback[0].chapters[0].id]: true });
    } finally {
      setIsLoading(false);
    }
  };

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const getBloomBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case "remember":
      case "understand":
        return "secondary";
      case "apply":
        return "hypothesis";
      case "analyze":
        return "developing";
      case "evaluate":
      case "create":
        return "confirmed";
      default:
        return "outline";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" /> Syllabus & Curriculum Tree
          </h1>
          <p className="text-sm text-slate-500">
            Hierarchical course blueprint: Course → Chapter → Topic → Bloom's Taxonomy Learning Objectives.
          </p>
        </div>

        {/* Course Selector */}
        {courses.length > 1 && (
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}: {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {currentCourse && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="hypothesis" className="font-mono text-[10px]">
                {currentCourse.code}
              </Badge>
              <span className="text-xs text-slate-500">• {currentCourse.chapters?.length || 0} Units</span>
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">{currentCourse.title}</CardTitle>
            <p className="text-xs text-slate-600 mt-1">{currentCourse.description}</p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            {currentCourse.chapters?.map((chapter) => {
              const isChExpanded = !!expandedChapters[chapter.id];
              return (
                <div key={chapter.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  {/* Chapter Header */}
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-between text-left cursor-pointer border-b border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-sm font-bold text-slate-900">{chapter.title}</span>
                      <span className="text-[11px] text-slate-500">({chapter.topics?.length || 0} Topics)</span>
                    </div>
                    {isChExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {/* Chapter Content / Topics */}
                  {isChExpanded && (
                    <div className="p-3 sm:p-4 space-y-3 bg-white">
                      {chapter.topics?.map((topic) => {
                        const isTopExpanded = !!expandedTopics[topic.id];
                        return (
                          <div
                            key={topic.id}
                            className="border border-slate-100 rounded-xl p-3.5 hover:border-indigo-100 transition bg-slate-50/40"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div
                                onClick={() => toggleTopic(topic.id)}
                                className="flex items-start gap-2 cursor-pointer flex-1"
                              >
                                {isTopExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{topic.name}</span>
                                    <Badge variant="developing" className="text-[9px] py-0 px-1 font-mono">
                                      {topic.code}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{topic.description}</p>
                                </div>
                              </div>

                              {/* Action Launchers */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                <Link href={`/student/games?tab=quiz_battle&topic=${encodeURIComponent(topic.name)}`}>
                                  <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 gap-1 text-slate-700">
                                    <Zap className="w-3 h-3 text-amber-500" /> Quiz
                                  </Button>
                                </Link>
                                <Link href={`/student/games?tab=code_quest`}>
                                  <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 gap-1 text-slate-700">
                                    <Code2 className="w-3 h-3 text-emerald-600" /> Code
                                  </Button>
                                </Link>
                                <Link href={`/student/ai-tutor?topic=${encodeURIComponent(topic.name)}`}>
                                  <Button size="sm" className="h-7 text-[10px] px-2 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Sparkles className="w-3 h-3" /> AI Tutor
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            {/* Learning Objectives & Concepts Drawer */}
                            {isTopExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-200/60 pl-6 space-y-3">
                                {/* Objectives */}
                                <div>
                                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                                    <Target className="w-3 h-3 text-indigo-500" /> Bloom's Taxonomy Learning Objectives:
                                  </span>
                                  <ul className="space-y-1">
                                    {topic.learning_objectives?.map((lo) => (
                                      <li key={lo.id} className="text-xs text-slate-700 flex items-start gap-2">
                                        <Badge
                                          variant={getBloomBadgeVariant(lo.bloom_level) as any}
                                          className="text-[9px] py-0 px-1.5 shrink-0 mt-0.5"
                                        >
                                          {lo.bloom_level}
                                        </Badge>
                                        <span>{lo.description}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Core Concepts */}
                                {topic.concepts?.length > 0 && (
                                  <div>
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                                      Core Concepts:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {topic.concepts.map((co) => (
                                        <Badge key={co.id} variant="outline" className="text-[10px] bg-white">
                                          {co.name} (Diff: {co.difficulty}/3)
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
