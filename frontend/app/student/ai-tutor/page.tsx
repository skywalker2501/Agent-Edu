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
} from "lucide-react";

export default function SocraticTutorPage() {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello Rahul! I am your Socratic AI Tutor, powered by Ollama local LLM inference and grounded in your syllabus materials. I never give away complete code solutions immediately; instead, I provide guided hints, conceptual models, and step-by-step reasoning to build genuine mastery.\n\nWhat DSA concept or problem would you like to explore today?",
      teaching_mode: "guide_step_by_step",
      model_name: "llama3.2:3b",
      provider: "ollama",
      citations: ["CS-DSA-101: Syllabus & Knowledge Graph Blueprint"],
      suggested_followups: [
        "How do two pointers work on a sorted array?",
        "Why does recursion need a base case?",
        "Explain tree height vs depth",
        "How does memoization speed up Fibonacci?"
      ],
      created_at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<TutorMode>("guide_step_by_step");
  const [selectedTopic, setSelectedTopic] = useState("Arrays & Dynamic Lists");
  const [isSending, setIsSending] = useState(false);
  const [currentModel, setCurrentModel] = useState("llama3.2:3b");
  const [provider, setProvider] = useState("ollama");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get("topic");
      if (topic) {
        setSelectedTopic(topic);
      }
    }
  }, []);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isSending) return;

    const userMsg: TutorMessage = {
      id: String(Date.now()),
      role: "user",
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await api.sendTutorMessage({
        topic: selectedTopic,
        message: textToSend,
        teaching_mode: activeMode,
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
        teaching_mode: activeMode,
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
      console.error("Tutor error:", err);
      const lower = textToSend.toLowerCase();
      let contextualContent = "";
      let contextualHints: string[] = [];
      let contextualCode: string | undefined = undefined;

      if (lower.includes("stack") || lower.includes("lifo")) {
        contextualContent =
          "A **Stack** is a fundamental linear data structure that operates on the **LIFO (Last In, First Out)** principle. The last element added is the first one removed—just like a physical stack of plates.\n\nKey operations:\n- `push(x)`: Add an element to the top ($O(1)$)\n- `pop()`: Remove and return the top element ($O(1)$)\n- `peek()`: View the top element without removing it ($O(1)$)\n\nTo connect this to our practice: How do you think a stack can be used to check if parentheses like `'({[]})'` are properly balanced?";
        contextualHints = [
          "Push opening brackets onto the stack as you encounter them.",
          "When you see a closing bracket, pop from the stack and verify that it matches.",
          "If the stack is completely empty at the end, the string is balanced."
        ];
        contextualCode = "stack = []\nstack.append(10)  # push\ntop = stack.pop() # pop";
      } else if (lower.includes("queue") || lower.includes("fifo")) {
        contextualContent =
          "A **Queue** is a linear data structure that follows the **FIFO (First In, First Out)** principle. Think of a line at a ticket counter: the first person to join is the first one served.\n\nKey operations:\n- `enqueue(x)`: Add an element to the back ($O(1)$)\n- `dequeue()`: Remove and return the front element ($O(1)$)";
        contextualHints = [
          "In Python, use collections.deque for efficient $O(1)$ operations on both ends."
        ];
      } else if (lower.includes("tree") || lower.includes("bst")) {
        contextualContent =
          "A **Binary Tree** is a hierarchical data structure where every node has at most two children (`left` and `right`). In a **Binary Search Tree (BST)**, all keys in the left subtree are strictly less than the node, and all in the right subtree are greater.";
        contextualHints = [
          "An In-Order traversal of a valid BST always visits nodes in ascending order."
        ];
      } else if (lower.includes("recursion") || lower.includes("recursive")) {
        contextualContent =
          "In **Recursion**, a function solves a problem by calling itself with smaller inputs. Every correct recursive function requires:\n1. A **Base Case** to halt execution and prevent call-stack overflow.\n2. A **Recursive Step** that moves closer to that base condition.";
        contextualHints = [
          "Always define the simplest possible input first (e.g., $n \\le 1$ or empty list)."
        ];
      } else {
        contextualContent =
          `When reasoning about **${selectedTopic}**, let's decompose the problem into manageable steps. What specific input, constraint, or invariant are you exploring right now?`;
        contextualHints = [
          "Identify the input parameters and expected return type.",
          "Consider the edge cases (empty input, single element, duplicates)."
        ];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          content: contextualContent,
          teaching_mode: activeMode,
          hints: contextualHints,
          code_snippet: contextualCode,
          model_name: "socratic-pedagogical-engine",
          provider: "socratic_fallback",
          citations: [`Syllabus Module: ${selectedTopic}`],
          suggested_followups: [
            `Give me a hint on ${selectedTopic}`,
            `Show a worked example for ${selectedTopic}`,
            `Test my understanding of ${selectedTopic}`,
          ],
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearConversation = async () => {
    if (conversationId) {
      try {
        await api.deleteTutorConversation(conversationId);
      } catch (e) {
        console.warn("Could not delete conversation on backend:", e);
      }
    }
    setConversationId(null);
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: `Conversation restarted! You are exploring **${selectedTopic}** with your Socratic AI Tutor. What would you like to solve or understand next?`,
        teaching_mode: activeMode,
        model_name: currentModel,
        provider: provider,
        suggested_followups: [
          `Give me a practice problem on ${selectedTopic}`,
          `Explain the key invariants of ${selectedTopic}`,
        ],
        created_at: new Date().toISOString(),
      },
    ]);
    setShowClearConfirm(false);
  };

  const modes: { id: TutorMode; label: string; icon: any; desc: string }[] = [
    { id: "guide_step_by_step", label: "Guide Step-by-Step", icon: ListOrdered, desc: "Socratic questioning" },
    { id: "hint", label: "Give a Hint", icon: Lightbulb, desc: "Progressive scaffolding" },
    { id: "worked_example", label: "Worked Example", icon: FileCode, desc: "Concrete walkthrough" },
    { id: "explain", label: "Explain Concept", icon: HelpCircle, desc: "Conceptual model" },
    { id: "test_understanding", label: "Test Understanding", icon: CheckCircle, desc: "Concept check quiz" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header with Mode Toggles & Topic Selector & Model Chip */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Socratic AI Tutor
                </h2>
                {/* Model Indicator Chip */}
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-2 flex items-center gap-1 font-mono bg-slate-50 border-slate-200"
                >
                  <Cpu className="w-3 h-3 text-indigo-600" />
                  <span>{currentModel}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${provider === "ollama" ? "bg-emerald-500" : "bg-amber-500"}`} />
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                Cognitive scaffolding grounded in approved DSA syllabus & knowledge graph
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Arrays & Dynamic Lists">Arrays & Two Pointers</option>
              <option value="Stacks & Call Frames">Stacks & Call Frames</option>
              <option value="Recursion & Divide-and-Conquer">Recursion & Base Cases</option>
              <option value="Trees & Binary Search Trees">Trees & BST Traversals</option>
              <option value="Dynamic Programming & Memoization">Dynamic Programming</option>
              <option value="Sorting Algorithms">Sorting Algorithms</option>
              <option value="Searching & Binary Search">Binary Search</option>
              <option value="Graphs & Traversal Algorithms">Graphs & BFS/DFS</option>
            </select>

            {/* Clear Chat Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="h-8 px-2 text-xs text-slate-500 hover:text-red-600 border-slate-200"
              title="Start New Chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Pedagogical Teaching Mode Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal for Resetting Conversation */}
      {showClearConfirm && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-900">
          <span>Start a fresh conversation? Current conversation history will be archived.</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={handleClearConversation}>
              Confirm Reset
            </Button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <Card className="flex-1 overflow-hidden border-slate-200 flex flex-col bg-slate-50/50">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isBot ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-700 text-white"
                  }`}
                >
                  {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="space-y-2.5 flex-1 min-w-0">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isBot
                        ? "bg-white border border-slate-200 text-slate-800 shadow-2xs"
                        : "bg-indigo-600 text-white shadow-xs"
                    }`}
                  >
                    {isBot && (
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        <span>Mode: {msg.teaching_mode?.replace(/_/g, " ") || "Socratic"}</span>
                        <span>{msg.model_name ? `Inference: ${msg.model_name}` : "AI Scaffolding"}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Code Snippet Box */}
                    {isBot && msg.code_snippet && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 font-mono text-xs">
                        <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 text-slate-400 text-[11px] flex items-center justify-between">
                          <span className="flex items-center gap-1 font-mono text-indigo-400">
                            <Code2 className="w-3.5 h-3.5" /> Conceptual Example
                          </span>
                          <span className="text-[10px] text-slate-500">Read-Only Scaffolding</span>
                        </div>
                        <pre className="p-3 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre">
                          {msg.code_snippet}
                        </pre>
                      </div>
                    )}

                    {/* Hints Section */}
                    {isBot && msg.hints && msg.hints.length > 0 && (
                      <div className="mt-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          Progressive Socratic Hints:
                        </div>
                        <ul className="text-xs text-amber-800 space-y-1 list-none pl-1">
                          {msg.hints.map((hint, hIdx) => (
                            <li key={hIdx} className="flex items-start gap-1.5">
                              <span className="text-amber-500 font-bold shrink-0">•</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* RAG Grounding Citations */}
                    {isBot && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
                        <BookMarked className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-700">Syllabus Grounding: </span>
                          <span>{msg.citations.map((c) => typeof c === "string" ? c : c.title).join("; ")}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clickable Suggested Followups */}
                  {isBot && msg.suggested_followups && msg.suggested_followups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {msg.suggested_followups.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(s)}
                          className="text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 text-left transition cursor-pointer flex items-center gap-1"
                        >
                          <ChevronRight className="w-3 h-3 text-indigo-500" />
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-medium">Formulating Socratic response via Ollama ({currentModel})...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Ask a question in "${activeMode.replace(/_/g, " ")}" mode...`}
            className="flex-1 p-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
