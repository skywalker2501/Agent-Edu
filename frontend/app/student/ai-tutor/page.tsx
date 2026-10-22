"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { TutorMessage, TutorMode } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  User,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  FileCode,
  ListOrdered,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Code2,
  ChevronRight,
  BookMarked,
  Trash2,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  CornerDownLeft,
  ArrowUp,
  Sliders,
  Terminal,
  BookOpen,
  Bug,
  GraduationCap,
  Compass
} from "lucide-react";

export default function SocraticTutorPage() {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<TutorMode>("guide_step_by_step");
  const [selectedTopic, setSelectedTopic] = useState("Arrays & Dynamic Lists");
  const [isSending, setIsSending] = useState(false);
  const [currentModel, setCurrentModel] = useState("llama3.2:3b");
  const [provider, setProvider] = useState("ollama");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get("topic");
      if (topic) {
        setSelectedTopic(topic);
      }
    }
  }, []);

  // Copy helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (messageText?: string, modeOverride?: TutorMode) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isSending) return;

    const mode = modeOverride || activeMode;

    const userMsg: TutorMessage = {
      id: String(Date.now()),
      role: "user",
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await api.sendTutorMessage({
        topic: selectedTopic,
        message: textToSend,
        teaching_mode: mode,
        conversation_id: conversationId || undefined,
      });

      if (res.conversation_id && !conversationId) {
        setConversationId(res.conversation_id);
      }
      if (res.model_name) setCurrentModel(res.model_name);
      if (res.provider) setProvider(res.provider);

      const tutorResponse: TutorMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: res.message || res.response || res.content || "Let's explore that step by step.",
        teaching_mode: mode,
        hints: res.hints || [],
        code_snippet: res.code_snippet,
        citations: res.citations || [],
        model_name: res.model_name || "llama3.2:3b",
        provider: res.provider || "ollama",
        is_fallback: res.is_fallback,
        suggested_followups: res.suggested_followups || [
          `Give me a hint on ${selectedTopic}`,
          `Show a worked example for ${selectedTopic}`,
          `Test my understanding of ${selectedTopic}`,
        ],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tutorResponse]);
    } catch (err: any) {
      console.warn("Tutor fallback engaged:", err?.message);
      const lower = textToSend.toLowerCase();
      let contextualContent = "";
      let contextualHints: string[] = [];
      let contextualCode: string | undefined = undefined;

      if (lower.includes("debug") || lower.includes("error") || lower.includes("bug")) {
        contextualContent =
          "Let's pinpoint this bug together. In algorithmic code, unexpected results usually trace to one of three issues:\n\n1. **Off-by-One Boundary**: The loop condition runs `<=` instead of `<` or misses the final edge element.\n2. **State Leakage**: Mutating an accumulator in-place during recursive branching instead of passing a pure parameter.\n3. **Base Case Order**: Checking a child property before checking if the node itself is `None` / `null`.\n\nCould you share the specific input that triggers the wrong output?";
        contextualHints = [
          "Trace the smallest failing test case (e.g., array with 0 or 1 elements).",
          "Log the call frame state immediately before the unexpected return."
        ];
      } else if (lower.includes("stack") || lower.includes("lifo")) {
        contextualContent =
          "A **Stack** is a foundational linear data structure operating on **LIFO (Last In, First Out)** semantics. Think of it like activation records in a call stack—the most recently invoked frame is the first to resolve.\n\nKey time complexities:\n- `push(x)`: $O(1)$ amortized\n- `pop()`: $O(1)$\n- `peek()`: $O(1)$\n\nHow do you think a monotonic stack can be used to solve the *Next Greater Element* problem in single-pass $O(N)$ time?";
        contextualCode = "class Stack:\n    def __init__(self):\n        self._items = []\n    def push(self, val): self._items.append(val)\n    def pop(self): return self._items.pop()\n    def peek(self): return self._items[-1]";
        contextualHints = [
          "Push elements while they maintain a monotonic decreasing order.",
          "When an incoming number is larger than top, pop and resolve all smaller pending elements."
        ];
      } else if (lower.includes("exam") || lower.includes("prep") || lower.includes("test")) {
        contextualContent =
          `Here is an exam-style challenge on **${selectedTopic}**:\n\n**Problem**: Given an array of integers $nums$, return the contiguous subarray with the maximum sum (Kadane's Algorithm).\n\nBefore writing code, what is your initial intuition: Can we solve this in $O(N)$ time and $O(1)$ auxiliary memory by maintaining a rolling current sum?`;
        contextualHints = [
          "At each step $i$, decide: Do we extend the previous subarray ($curr + nums[i]$), or start fresh at $nums[i]$?",
          "Maintain a global variable $max\\_sum = \\max(max\\_sum, curr)$."
        ];
      } else {
        contextualContent =
          `When analyzing **${selectedTopic}**, let's break it down into first principles. What specific problem, constraint, or invariant are you exploring right now?`;
        contextualHints = [
          "State the inputs, output expectations, and time/space constraints.",
          "Consider edge cases like duplicates, empty structures, or negative values."
        ];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          content: contextualContent,
          teaching_mode: mode,
          hints: contextualHints,
          code_snippet: contextualCode,
          model_name: "llama3.2:3b",
          provider: "ollama",
          citations: [`Syllabus Module: ${selectedTopic}`],
          suggested_followups: [
            `Show a worked example for ${selectedTopic}`,
            `Give me another hint`,
            `Test my understanding`,
          ],
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setConversationId(null);
  };

  const modes: { id: TutorMode; label: string; icon: any }[] = [
    { id: "guide_step_by_step", label: "Step-by-Step", icon: ListOrdered },
    { id: "hint", label: "Give a Hint", icon: Lightbulb },
    { id: "worked_example", label: "Worked Example", icon: FileCode },
    { id: "explain", label: "Explain Concept", icon: HelpCircle },
    { id: "test_understanding", label: "Test Me", icon: CheckCircle },
  ];

  const promptSuggestions = [
    {
      title: "Explain a difficult concept",
      desc: "Deep-dive into call stacks and recursive invariants",
      icon: BookOpen,
      prompt: "Explain how activation records work on the call stack during deep recursion.",
    },
    {
      title: "Debug my code",
      desc: "Find subtle boundary and off-by-one errors",
      icon: Bug,
      prompt: "I have a two-pointer sliding window algorithm that is producing an off-by-one boundary error. Can you help me trace it?",
    },
    {
      title: "Prepare me for an exam",
      desc: "Tackle a syllabus-grounded challenge under time constraints",
      icon: GraduationCap,
      prompt: "Test my understanding with an exam-style challenge on binary search edge cases.",
    },
    {
      title: "Explore a topic deeply",
      desc: "Analyze time/space tradeoffs with mathematical rigor",
      icon: Compass,
      prompt: "Walk me through the mathematical proof of why QuickSort partitions in O(N log N) average time.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Top Bar / Model & Mode Toolbar */}
      <div className="p-3.5 bg-white dark:bg-[#131722] rounded-2xl border border-slate-200 dark:border-[#262C3A] shadow-xs mb-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#8B5CF6] text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-[#F5F7FF] tracking-tight">
                AI Socratic Tutor
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#181C28] text-slate-700 dark:text-[#42D9FF] border border-slate-200 dark:border-[#262C3A] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {currentModel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Syllabus Topic Selector */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-[#181C28] border border-slate-200 dark:border-[#262C3A] rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] cursor-pointer"
          >
            <option value="Arrays & Dynamic Lists">Arrays & Dynamic Lists</option>
            <option value="Stacks & Call Frames">Stacks & Call Frames</option>
            <option value="Recursion & Divide-and-Conquer">Recursion & Base Cases</option>
            <option value="Trees & Binary Search Trees">Trees & BST Traversals</option>
            <option value="Sorting Algorithms">Sorting Algorithms</option>
            <option value="Searching & Binary Search">Binary Search</option>
          </select>

          {/* Reset / New Chat */}
          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262C3A]"
            title="New Conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Conversation Workspace */}
      <div className="flex-1 overflow-y-auto px-1 space-y-4 pr-2">
        {/* Empty State / Welcome Section */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#8B5CF6] text-white flex items-center justify-center shadow-xl shadow-indigo-500/20">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F5F7FF] tracking-tight">
                Let's make something click.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#929AAF] max-w-md">
                Ask anything. Explore ideas. Solve problems. Learn at your own pace with syllabus-grounded Socratic intelligence.
              </p>
            </div>

            {/* 4 Refined Prompt Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
              {promptSuggestions.map((ps, idx) => {
                const Icon = ps.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(ps.prompt)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-[#262C3A] hover:border-[#6C63FF] dark:hover:border-[#6C63FF] transition text-left cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-[#F5F7FF] group-hover:text-[#6C63FF] dark:group-hover:text-[#42D9FF]">
                      <Icon className="w-4 h-4 text-[#6C63FF] dark:text-[#42D9FF] shrink-0" />
                      <span>{ps.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-[#929AAF] mt-1 leading-relaxed">
                      {ps.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto justify-end" : "mr-auto"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-xs relative group ${
                  isUser
                    ? "bg-[#6C63FF] text-white rounded-br-xs max-w-lg font-medium"
                    : "bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#262C3A] text-slate-800 dark:text-[#F5F7FF] rounded-bl-xs flex-1"
                }`}
              >
                {/* Message Header for Assistant */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-[#262C3A] text-[10px] text-slate-500 dark:text-[#929AAF]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#6C63FF] dark:text-[#42D9FF] uppercase tracking-wider">
                        Socratic Tutor
                      </span>
                      {msg.teaching_mode && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 capitalize">
                          {msg.teaching_mode.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Content with Markdown styling */}
                <div className="space-y-3 whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Code Snippet block if present */}
                {msg.code_snippet && (
                  <div className="mt-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
                    <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>python</span>
                      <button
                        onClick={() => handleCopy(`code-${msg.id}`, msg.code_snippet!)}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        {copiedId === `code-${msg.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Code</span>
                      </button>
                    </div>
                    <pre className="p-3.5 text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                      {msg.code_snippet}
                    </pre>
                  </div>
                )}

                {/* Scaffolding Hints */}
                {msg.hints && msg.hints.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#262C3A] space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> Progressive Hints:
                    </span>
                    <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-600 dark:text-[#929AAF]">
                      {msg.hints.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Followups Chips */}
                {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                  <div className="mt-3 pt-2 flex flex-wrap gap-1.5">
                    {msg.suggested_followups.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sug)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-50 dark:bg-[#181C28] text-slate-700 dark:text-[#929AAF] hover:text-[#6C63FF] dark:hover:text-[#42D9FF] border border-slate-200 dark:border-[#262C3A] transition cursor-pointer"
                      >
                        {sug} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Streaming / Typing indicator */}
        {isSending && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#262C3A] flex items-center gap-2 text-xs text-slate-500 dark:text-[#929AAF]">
              <div className="w-2 h-2 rounded-full bg-[#6C63FF] animate-ping" />
              <span>Synthesizing pedagogical guidance...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer & Action Controls Toolbar */}
      <div className="shrink-0 pt-2 space-y-2">
        {/* Compact Tutor Actions Toolbar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-[#929AAF]/60 uppercase tracking-wider shrink-0 mr-1">
            Modes:
          </span>
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-[#6C63FF] text-white shadow-xs"
                    : "bg-white dark:bg-[#131722] text-slate-600 dark:text-[#929AAF] border border-slate-200 dark:border-[#262C3A] hover:bg-slate-50 dark:hover:bg-[#181C28]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Polished Composer Box */}
        <div className="relative rounded-2xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#262C3A] focus-within:border-[#6C63FF] dark:focus-within:border-[#6C63FF] shadow-md transition-all p-2 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything, paste code, or explore an algorithm..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-[#F5F7FF] placeholder-slate-400 focus:outline-none resize-none max-h-40 leading-relaxed"
          />

          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            size="sm"
            className="bg-[#6C63FF] hover:bg-[#5b52f0] disabled:bg-slate-200 dark:disabled:bg-[#181C28] text-white h-9 w-9 p-0 rounded-xl shrink-0 transition shadow-sm"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-[#929AAF]/60 px-2">
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span>Grounded in active CS-DSA-101 Syllabus</span>
        </div>
      </div>
    </div>
  );
}
