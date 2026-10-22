"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { LearnerState, Misconception } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Network,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Target,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Check,
  Compass,
  ArrowUpRight
} from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  type: "topic" | "misconception";
  category?: string;
  mastery?: number;
  status?: string;
  confidence?: number;
  color?: string;
  x?: number;
  y?: number;
  tier?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  strength?: number;
}

export default function KnowledgeMapPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [learnerState, setLearnerState] = useState<LearnerState | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<"all" | "mastered" | "needs_attention" | "misconception">("all");
  const [activeTab, setActiveTab] = useState<"graph" | "hierarchy" | "list">("graph");
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [mapRes, modelRes] = await Promise.allSettled([
          api.getKnowledgeMap(),
          api.getLearnerModel(),
        ]);

        if (mapRes.status === "fulfilled" && mapRes.value) {
          const rawNodes: GraphNode[] = mapRes.value.nodes || [];
          const rawEdges: GraphEdge[] = mapRes.value.edges || [];

          // Compute structured topological layout coordinates
          const positionedNodes = computeNodeCoordinates(rawNodes);
          setNodes(positionedNodes);
          setEdges(rawEdges);

          // Select misconception or default core node
          const defaultNode = positionedNodes.find(n => n.type === "misconception") || positionedNodes[0];
          setSelectedNode(defaultNode || null);
        }

        if (modelRes.status === "fulfilled") {
          setLearnerState(modelRes.value);
        }
      } catch (err) {
        console.error("Failed to load knowledge map data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute clean 4-tier DAG coordinates with ample breathing room
  const computeNodeCoordinates = (rawList: GraphNode[]): GraphNode[] => {
    const coordsMap: Record<string, { x: number; y: number; tier: number }> = {
      // Tier 1: Foundations & Memory Architecture
      arrays: { x: 135, y: 105, tier: 1 },
      stacks: { x: 135, y: 260, tier: 1 },
      linked_lists: { x: 135, y: 430, tier: 1 },

      // Tier 2: Core Recursion & Algorithmic Paradigm
      sorting: { x: 420, y: 105, tier: 2 },
      recursion: { x: 420, y: 260, tier: 2 },
      searching: { x: 420, y: 430, tier: 2 },

      // Tier 3: Hierarchical Trees & Dynamic Programming
      trees: { x: 710, y: 165, tier: 3 },
      dp: { x: 710, y: 360, tier: 3 },

      // Tier 4: Complex Graphs & Network Traversals
      graphs: { x: 995, y: 260, tier: 4 },
    };

    let miscCount = 0;

    return rawList.map((node) => {
      const labelLower = node.label.toLowerCase();
      let key = "";

      if (labelLower.includes("array")) key = "arrays";
      else if (labelLower.includes("stack") && node.type === "topic") key = "stacks";
      else if (labelLower.includes("linked")) key = "linked_lists";
      else if (labelLower.includes("recursion")) key = "recursion";
      else if (labelLower.includes("sort")) key = "sorting";
      else if (labelLower.includes("search")) key = "searching";
      else if (labelLower.includes("tree")) key = "trees";
      else if (labelLower.includes("dynamic") || labelLower.includes("dp") || labelLower.includes("memo")) key = "dp";
      else if (labelLower.includes("graph")) key = "graphs";

      if (node.type === "misconception") {
        miscCount++;
        return {
          ...node,
          tier: 2,
          x: 275,
          y: 355 + (miscCount - 1) * 85,
        };
      }

      const assigned = coordsMap[key] || { x: 200, y: 200, tier: 1 };
      return {
        ...node,
        tier: assigned.tier,
        x: assigned.x,
        y: assigned.y,
      };
    });
  };

  const filteredNodes = nodes.filter((n) => {
    if (filterType === "all") return true;
    if (filterType === "misconception") return n.type === "misconception";
    if (filterType === "mastered") return (n.mastery || 0) >= 80;
    if (filterType === "needs_attention") return n.type === "topic" && (n.mastery || 0) < 60;
    return true;
  });

  const getStatusBadge = (node: GraphNode) => {
    if (node.type === "misconception") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> Diagnosed Misconception
        </span>
      );
    }
    const score = node.mastery || 0;
    if (score >= 80) return <Badge variant="mastered">Mastered ({score}%)</Badge>;
    if (score >= 60) return <Badge variant="developing">Developing ({score}%)</Badge>;
    if (score > 0) return <Badge variant="needs_attention">Needs Remediation ({score}%)</Badge>;
    return <Badge variant="outline">Unassessed (0%)</Badge>;
  };

  // Helper to split long titles into clean two-line displays so text never gets chopped with '...'
  const formatNodeLines = (label: string, isMisconception: boolean) => {
    if (isMisconception) {
      const clean = label.replace(/^Misconception:\s*/i, "");
      if (clean.includes("Stack-Frame")) {
        return { line1: "Stack-Frame Execution", line2: "Misunderstood" };
      }
      const words = clean.split(" ");
      const mid = Math.ceil(words.length / 2);
      return { line1: words.slice(0, mid).join(" "), line2: words.slice(mid).join(" ") };
    }

    if (label.includes(" & ")) {
      const parts = label.split(" & ");
      return { line1: parts[0], line2: "& " + parts[1] };
    }
    if (label.includes("-and-")) {
      const parts = label.split("-and-");
      return { line1: parts[0], line2: "& " + parts[1] };
    }
    const words = label.split(" ");
    if (words.length > 2) {
      const mid = Math.ceil(words.length / 2);
      return { line1: words.slice(0, mid).join(" "), line2: words.slice(mid).join(" ") };
    }
    return { line1: label, line2: "" };
  };

  const stats = {
    totalTopics: nodes.filter(n => n.type === "topic").length,
    mastered: nodes.filter(n => n.type === "topic" && (n.mastery || 0) >= 80).length,
    developing: nodes.filter(n => n.type === "topic" && (n.mastery || 0) >= 50 && (n.mastery || 0) < 80).length,
    misconceptions: nodes.filter(n => n.type === "misconception").length,
  };

  // Tier groupings for DAG View
  const tiers = [
    { num: 1, title: "Tier 1: Prerequisite Foundations", subtitle: "Memory, Linear Structures & Frame Allocation" },
    { num: 2, title: "Tier 2: Algorithmic Thinking", subtitle: "Recursion Decomposition & Comparative Sorting" },
    { num: 3, title: "Tier 3: Hierarchical Structures", subtitle: "Binary Trees & Optimal Dynamic Programming" },
    { num: 4, title: "Tier 4: Graph Theory & Networks", subtitle: "Adjacency Models, BFS/DFS Traversals" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12 pt-1">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Pedagogical Knowledge Graph & Cognitive Twin</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Interactive Bayesian Knowledge Map (BKT) tracking prerequisite dependencies and diagnosed misconception pathways.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("graph")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === "graph" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Interactive Graph
          </button>
          <button
            onClick={() => setActiveTab("hierarchy")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === "hierarchy" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Prerequisite DAG
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === "list" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Concept Matrix
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Curriculum Scope</p>
          <div className="flex items-baseline justify-between mt-1">
            <h4 className="text-xl font-black text-slate-900">{stats.totalTopics}</h4>
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">DSA 102</span>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mastered Concepts</p>
          <div className="flex items-baseline justify-between mt-1">
            <h4 className="text-xl font-black text-emerald-600">{stats.mastered}</h4>
            <span className="text-[10px] text-emerald-700 font-semibold">&gt; 80% BKT Confidence</span>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Active Practice</p>
          <div className="flex items-baseline justify-between mt-1">
            <h4 className="text-xl font-black text-amber-600">{stats.developing}</h4>
            <span className="text-[10px] text-amber-700 font-semibold">Developing State</span>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Misconceptions</p>
          <div className="flex items-baseline justify-between mt-1">
            <h4 className="text-xl font-black text-rose-600">{stats.misconceptions}</h4>
            <span className="text-[10px] text-rose-700 font-semibold">Diagnostic Flag</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE SVG GRAPH */}
      {activeTab === "graph" && (
        <div className="space-y-4">
          {/* Filter Bar & Canvas Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 font-medium px-1.5 flex items-center gap-1 text-[11px]">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { id: "all", label: "All Nodes" },
                { id: "mastered", label: "Mastered (80%+)" },
                { id: "needs_attention", label: "Needs Remediation" },
                { id: "misconception", label: "Misconceptions" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-xs ${
                    filterType === f.id
                      ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Canvas Zoom & Layout Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.15))}
                  title="Zoom Out"
                  className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono text-[11px] text-slate-700 font-semibold select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}
                  title="Zoom In"
                  className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                  className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer ml-0.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                  isExpanded
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" /> Split View
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" /> Full Width
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Grid: Interactive Canvas & Detail Inspector */}
          <div className={`grid gap-5 ${isExpanded ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"}`}>
            {/* SVG Visual Graph Container */}
            <Card
              className={`${
                isExpanded ? "w-full" : "lg:col-span-8 xl:col-span-8"
              } border-slate-800 bg-[#070b14] text-white relative overflow-hidden shadow-sm flex flex-col`}
            >
              {/* Header Bar with Column Tier Indicators */}
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 select-none">
                <span className="flex items-center gap-1.5 font-medium text-slate-200 text-xs">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Prerequisite Flow: Tier 1 (Linear) → Tier 2 (Recursion) → Tier 3 (Hierarchical) → Tier 4 (Graphs)
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Click any node to inspect cognitive profile
                </span>
              </div>

              {/* Responsive SVG Viewport */}
              <div className="p-3 sm:p-5 overflow-auto flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/80 via-[#070b14] to-[#040711] min-h-[500px]">
                {isLoading ? (
                  <div className="text-center space-y-3 py-16">
                    <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Rendering Knowledge Graph...</p>
                  </div>
                ) : (
                  <div
                    className="w-full transition-transform duration-200 origin-center flex justify-center"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <svg
                      viewBox="0 0 1140 550"
                      className="w-full h-auto max-w-[1140px] select-none"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        {/* Gradients */}
                        <linearGradient id="grad-prereq" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                        <linearGradient id="grad-gap" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#fb7185" />
                        </linearGradient>
                        <linearGradient id="grad-root" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>

                        {/* Arrow markers */}
                        <marker id="arrow-prereq" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                          <polygon points="0 0, 9 3.5, 0 7" fill="#818cf8" />
                        </marker>
                        <marker id="arrow-gap" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                          <polygon points="0 0, 9 3.5, 0 7" fill="#f43f5e" />
                        </marker>
                        <marker id="arrow-root" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                          <polygon points="0 0, 9 3.5, 0 7" fill="#fbbf24" />
                        </marker>

                        {/* Glow Filter */}
                        <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Tier Column Background Guides */}
                      <g className="opacity-25 pointer-events-none">
                        <line x1="280" y1="20" x2="280" y2="530" stroke="#334155" strokeDasharray="4 6" strokeWidth="1" />
                        <line x1="565" y1="20" x2="565" y2="530" stroke="#334155" strokeDasharray="4 6" strokeWidth="1" />
                        <line x1="850" y1="20" x2="850" y2="530" stroke="#334155" strokeDasharray="4 6" strokeWidth="1" />

                        <text x="135" y="32" fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                          TIER 1 · FOUNDATIONS
                        </text>
                        <text x="420" y="32" fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                          TIER 2 · ALGORITHMS
                        </text>
                        <text x="710" y="32" fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                          TIER 3 · HIERARCHIES & DP
                        </text>
                        <text x="995" y="32" fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                          TIER 4 · GRAPHS
                        </text>
                      </g>

                      {/* Render Connecting Edges with Curvature */}
                      {edges.map((edge) => {
                        const srcNode = nodes.find((n) => n.id === edge.source);
                        const tgtNode = nodes.find((n) => n.id === edge.target);
                        if (!srcNode || !tgtNode) return null;

                        const isGap = edge.type === "observed_gap";
                        const isRoot = edge.type === "root_cause_dependency";
                        const strokeColor = isGap ? "url(#grad-gap)" : isRoot ? "url(#grad-root)" : "url(#grad-prereq)";
                        const markerId = isGap ? "url(#arrow-gap)" : isRoot ? "url(#arrow-root)" : "url(#arrow-prereq)";
                        const strokeDash = isRoot ? "5 4" : undefined;

                        // Precise node anchor widths (half-width)
                        const srcHalfW = srcNode.type === "misconception" ? 98 : 82;
                        const tgtHalfW = tgtNode.type === "misconception" ? 98 : 82;

                        let x1 = (srcNode.x || 0);
                        let y1 = (srcNode.y || 0);
                        let x2 = (tgtNode.x || 0);
                        let y2 = (tgtNode.y || 0);

                        // Calculate connector direction
                        if (x1 < x2) {
                          x1 += srcHalfW;
                          x2 -= tgtHalfW;
                        } else {
                          x1 -= srcHalfW;
                          x2 += tgtHalfW;
                        }

                        const dx = (x2 - x1) * 0.45;
                        const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                        const midX = (x1 + x2) / 2;
                        const midY = (y1 + y2) / 2;

                        const labelText = isGap ? "Observed Gap" : isRoot ? "Root Cause Dependency" : "Prerequisite";
                        const labelWidth = isRoot ? 116 : isGap ? 78 : 68;

                        return (
                          <g key={edge.id} className="transition-opacity">
                            <path
                              d={pathD}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={isGap || isRoot ? "2.5" : "2"}
                              strokeDasharray={strokeDash}
                              markerEnd={markerId}
                              opacity="0.85"
                            />
                            {/* Crisp Edge Label Badge */}
                            <g transform={`translate(${midX}, ${midY})`}>
                              <rect
                                x={-labelWidth / 2}
                                y="-9"
                                width={labelWidth}
                                height="18"
                                rx="4"
                                fill="#0b1120"
                                stroke={isGap ? "#e11d48" : isRoot ? "#d97706" : "#4338ca"}
                                strokeWidth="1"
                              />
                              <text
                                x="0"
                                y="3"
                                fill={isGap ? "#fda4af" : isRoot ? "#fde68a" : "#c7d2fe"}
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="font-mono select-none pointer-events-none"
                              >
                                {labelText}
                              </text>
                            </g>
                          </g>
                        );
                      })}

                      {/* Render Interactive Nodes */}
                      {filteredNodes.map((node) => {
                        const isSelected = selectedNode?.id === node.id;
                        const isMisconception = node.type === "misconception";
                        const nx = node.x || 100;
                        const ny = node.y || 100;
                        const halfW = isMisconception ? 98 : 82;
                        const halfH = isMisconception ? 31 : 29;
                        const nodeW = halfW * 2;
                        const nodeH = halfH * 2;
                        const score = node.mastery || 0;
                        const isMastered = score >= 80;
                        const isDeveloping = score >= 50 && score < 80;

                        const { line1, line2 } = formatNodeLines(node.label, isMisconception);

                        return (
                          <g
                            key={node.id}
                            transform={`translate(${nx}, ${ny})`}
                            onClick={() => setSelectedNode(node)}
                            className="cursor-pointer group"
                            filter={isSelected ? "url(#glow-selected)" : undefined}
                          >
                            {/* Card Background */}
                            <rect
                              x={-halfW}
                              y={-halfH}
                              width={nodeW}
                              height={nodeH}
                              rx="10"
                              className={`transition-all duration-200 ${
                                isSelected
                                  ? "fill-indigo-950 stroke-indigo-400 stroke-[2.5]"
                                  : isMisconception
                                  ? "fill-rose-950/80 stroke-rose-500 stroke-2 hover:fill-rose-900/90"
                                  : isMastered
                                  ? "fill-[#0f172a] stroke-emerald-500 stroke-2 hover:fill-slate-800"
                                  : isDeveloping
                                  ? "fill-[#0f172a] stroke-amber-500 stroke-2 hover:fill-slate-800"
                                  : "fill-[#0f172a] stroke-slate-700 stroke-1 hover:stroke-indigo-400"
                              }`}
                            />

                            {/* Node Title Line 1 */}
                            <text
                              x="0"
                              y={line2 ? -9 : -2}
                              textAnchor="middle"
                              fill="#f8fafc"
                              fontSize="11"
                              fontWeight="bold"
                              className="pointer-events-none select-none tracking-tight"
                            >
                              {line1}
                            </text>

                            {/* Node Title Line 2 */}
                            {line2 && (
                              <text
                                x="0"
                                y="5"
                                textAnchor="middle"
                                fill="#e2e8f0"
                                fontSize="10.5"
                                fontWeight="bold"
                                className="pointer-events-none select-none tracking-tight"
                              >
                                {line2}
                              </text>
                            )}

                            {/* Status Metric Pill */}
                            <g transform={`translate(0, ${halfH - 12})`}>
                              <rect
                                x="-42"
                                y="-8"
                                width="84"
                                height="15"
                                rx="3.5"
                                fill={
                                  isMisconception
                                    ? "#4c0519"
                                    : isMastered
                                    ? "#064e3b"
                                    : isDeveloping
                                    ? "#451a03"
                                    : "#1e293b"
                                }
                              />
                              <circle
                                cx="-32"
                                cy="-0.5"
                                r="2.5"
                                fill={
                                  isMisconception
                                    ? "#f43f5e"
                                    : isMastered
                                    ? "#10b981"
                                    : isDeveloping
                                    ? "#f59e0b"
                                    : "#94a3b8"
                                }
                              />
                              <text
                                x="2"
                                y="2.5"
                                textAnchor="middle"
                                fill={
                                  isMisconception
                                    ? "#fecdd3"
                                    : isMastered
                                    ? "#6ee7b7"
                                    : isDeveloping
                                    ? "#fde68a"
                                    : "#cbd5e1"
                                }
                                fontSize="9"
                                fontWeight="700"
                                className="font-mono select-none pointer-events-none"
                              >
                                {isMisconception ? "Diagnosed" : `BKT: ${score}%`}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>
            </Card>

            {/* Cognitive Inspector Drawer */}
            <Card
              className={`${
                isExpanded ? "w-full" : "lg:col-span-4 xl:col-span-4"
              } border-slate-200 shadow-sm flex flex-col justify-between`}
            >
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                    Cognitive Node Inspector
                  </span>
                  {selectedNode && getStatusBadge(selectedNode)}
                </div>
                <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                  {selectedNode?.label || "Select a concept node"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedNode?.type === "misconception"
                    ? "Identified by Observer agent; validated by instructor in Review Queue."
                    : `Curriculum Area: ${selectedNode?.category || "Computer Science Algorithms"}`}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                {selectedNode ? (
                  <div className="space-y-3.5">
                    {/* BKT Progress Meter for Topic */}
                    {selectedNode.type === "topic" && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Bayesian Mastery Score:</span>
                          <span className="font-bold text-indigo-600 font-mono">{selectedNode.mastery || 0}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              (selectedNode.mastery || 0) >= 80
                                ? "bg-emerald-500"
                                : (selectedNode.mastery || 0) >= 50
                                ? "bg-amber-500"
                                : "bg-indigo-600"
                            }`}
                            style={{ width: `${selectedNode.mastery || 0}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Prior Probability: 0.15</span>
                          <span>Slip: 0.10 | Guess: 0.20</span>
                        </p>
                      </div>
                    )}

                    {/* Diagnostic Misconception Callout */}
                    {selectedNode.type === "misconception" ? (
                      <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                        <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> Diagnosed Cognitive Misconception
                        </h5>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          The student demonstrates difficulty tracing how local variables unwind on the call stack, confusing recursive execution for an iterative in-place modification.
                        </p>
                        <div className="pt-1.5 border-t border-rose-200/60 text-[11px] text-rose-900">
                          <strong>Prescribed Remediation:</strong> Revisit Stacks & Call Frames (prerequisite weight: 0.90).
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Curriculum Role & Prerequisite Chain
                        </h5>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Core algorithmic concept. Weak mastery in this node creates compounding bottlenecks in downstream dynamic programming and tree traversals.
                        </p>
                      </div>
                    )}

                    {/* Direct Integrated Actions */}
                    <div className="space-y-2 pt-2">
                      <Link
                        href={`/student/ai-tutor?topic=${encodeURIComponent(selectedNode.label)}`}
                        className="block"
                      >
                        <Button variant="outline" className="w-full text-xs justify-between cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Consult Socratic AI Tutor
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Button>
                      </Link>

                      <Link href="/student/assessments" className="block">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs justify-between cursor-pointer shadow-xs">
                          <span className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" /> Practice Assessments
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-white" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <BrainCircuit className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Click any concept node to inspect its cognitive profile.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* VIEW 2: PREREQUISITE PROGRESSION DAG PATHWAY */}
      {activeTab === "hierarchy" && (
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" /> Prerequisite Learning Pathway
              </CardTitle>
              <CardDescription className="text-xs">
                Sequential curriculum dependencies from foundational memory structures to advanced graph theory.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {tiers.map((tier, idx) => {
                const tierNodes = nodes.filter(n => n.tier === tier.num && n.type === "topic");
                return (
                  <div key={tier.num} className="relative">
                    {/* Connecting line to next tier */}
                    {idx < tiers.length - 1 && (
                      <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-indigo-200 -z-0 hidden md:block" />
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {tier.num}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{tier.title}</h4>
                          <p className="text-xs text-slate-500">{tier.subtitle}</p>
                        </div>
                      </div>

                      {/* Tier Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:ml-10">
                        {tierNodes.map((n) => {
                          const score = n.mastery || 0;
                          return (
                            <div
                              key={n.id}
                              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition shadow-2xs space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-bold text-xs text-slate-900">{n.label}</h5>
                                {getStatusBadge(n)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-slate-500">
                                  <span>Mastery:</span>
                                  <span className="font-bold text-indigo-600 font-mono">{score}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-indigo-600"
                                    }`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                              <div className="pt-1 flex items-center justify-between text-[11px]">
                                <Link
                                  href={`/student/ai-tutor?topic=${encodeURIComponent(n.label)}`}
                                  className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                                >
                                  Ask AI Tutor <ChevronRight className="w-3 h-3" />
                                </Link>
                                <Link
                                  href="/student/assessments"
                                  className="text-slate-500 hover:text-slate-800"
                                >
                                  Practice
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 3: CONCEPT MATRIX LIST */}
      {activeTab === "list" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
            <CardTitle className="text-base font-bold text-slate-900">Curriculum Concepts & Status Matrix</CardTitle>
            <CardDescription className="text-xs">
              Complete tabular listing of topics, Bayesian confidence levels, and active diagnostic flags.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {nodes.map((n) => (
                <div
                  key={n.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm text-slate-900">{n.label}</h5>
                      {n.type === "misconception" && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-md">
                          Diagnostic Flag
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {n.category || (n.type === "misconception" ? "Diagnostic Gap" : "Core Topic")} · Tier {n.tier || 1}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(n)}
                    <Link
                      href={`/student/ai-tutor?topic=${encodeURIComponent(n.label)}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      AI Tutor <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
