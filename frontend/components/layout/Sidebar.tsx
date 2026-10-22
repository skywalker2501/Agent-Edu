"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  Network,
  Bot,
  BrainCircuit,
  History,
  CheckCircle2,
  Users,
  Compass,
  Sliders,
  ShieldAlert,
  BookOpen,
  LogOut,
  Sparkles,
  Trophy,
  Gamepad2,
  Radio,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Activity,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavGroup {
  label: string;
  items: {
    title: string;
    href: string;
    icon: any;
    badge?: string;
  }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const role = user.role;

  // Grouped Student Navigation
  const studentGroups: NavGroup[] = [
    {
      label: "LEARN",
      items: [
        { title: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
        { title: "My Classes", href: "/student/classes", icon: GraduationCap },
        { title: "Socratic AI Tutor", href: "/student/ai-tutor", icon: Bot, badge: "AI" },
        { title: "Assessments", href: "/student/assessments", icon: ClipboardList },
        { title: "Syllabus Tree", href: "/student/syllabus", icon: BookOpen },
      ]
    },
    {
      label: "GROW",
      items: [
        { title: "Knowledge Map", href: "/student/knowledge-map", icon: Network },
        { title: "Interventions", href: "/student/interventions", icon: CheckCircle2 },
        { title: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
        { title: "Learn & Play Hub", href: "/student/games", icon: Gamepad2 },
        { title: "Misconceptions", href: "/student/misconceptions", icon: BrainCircuit },
        { title: "Learning History", href: "/student/history", icon: History },
      ]
    },
    {
      label: "SYSTEM",
      items: [
        { title: "Settings & Profile", href: "/student/dashboard", icon: Settings },
      ]
    }
  ];

  // Grouped Teacher Navigation
  const teacherGroups: NavGroup[] = [
    {
      label: "TEACHING",
      items: [
        { title: "Teacher Studio", href: "/teacher/dashboard", icon: LayoutDashboard },
        { title: "Classes & Rosters", href: "/teacher/classes", icon: Users },
        { title: "Live Student Radar", href: "/teacher/student-radar", icon: Radio, badge: "LIVE" },
      ]
    },
    {
      label: "GOVERNANCE",
      items: [
        { title: "Review Queue", href: "/teacher/review-queue", icon: ClipboardList },
        { title: "Misconception Map", href: "/teacher/misconceptions", icon: BrainCircuit },
        { title: "Intervention Simulator", href: "/teacher/simulator", icon: Sliders },
        { title: "Outcome Monitoring", href: "/teacher/outcomes", icon: Compass },
        { title: "Decision History", href: "/teacher/decision-history", icon: History },
      ]
    }
  ];

  // Grouped Admin Navigation
  const adminGroups: NavGroup[] = [
    {
      label: "CONTROL CENTER",
      items: [
        { title: "System Analytics", href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "User Directory", href: "/admin/users", icon: Users },
        { title: "Audit Trail", href: "/admin/audit", icon: ShieldAlert },
      ]
    }
  ];

  const currentGroups =
    role === "teacher"
      ? teacherGroups
      : role === "admin"
      ? adminGroups
      : studentGroups;

  return (
    <aside
      className={cn(
        "border-r border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#0B0D12] min-h-screen flex flex-col justify-between transition-all duration-300 sticky top-0 h-screen select-none z-40 shadow-sm",
        collapsed ? "w-20 p-2.5" : "w-64 p-4"
      )}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2.5 group cursor-pointer",
              collapsed ? "justify-center w-full" : "px-2 py-1"
            )}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="h-5 w-5 animate-pulse-soft" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-extrabold text-lg text-slate-900 dark:text-[#F5F7FF] tracking-tight block leading-tight">
                  Agent<span className="text-[#6C63FF]">Edu</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#929AAF] font-medium block uppercase tracking-wider">
                  Cognitive AI Platform
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#131722] transition"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center mb-3">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#131722] transition"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Mini Role Card */}
        {!collapsed ? (
          <div className="px-2 mb-4">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#131722] border border-slate-200/80 dark:border-[#262C3A]">
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 dark:text-[#F5F7FF] truncate">
                  {user.full_name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-[#929AAF] capitalize font-medium">
                  {user.role} Workspace
                </p>
              </div>
              <Badge
                variant="hypothesis"
                className="text-[9px] uppercase font-bold shrink-0 bg-indigo-500/15 text-indigo-600 dark:text-cyan-400 border border-indigo-500/30"
              >
                {role}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-cyan-300 font-bold text-xs flex items-center justify-center">
              {user.full_name?.charAt(0) || "U"}
            </div>
          </div>
        )}

        {/* Grouped Navigation */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {currentGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-[#929AAF]/70 uppercase tracking-widest mb-1.5">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center rounded-xl text-xs font-medium transition-all duration-150 group",
                      collapsed ? "justify-center p-2.5 my-1" : "gap-3 px-3 py-2",
                      isActive
                        ? "bg-indigo-50 dark:bg-[#1E1B4B]/70 text-[#6C63FF] dark:text-[#42D9FF] font-bold border border-indigo-200 dark:border-indigo-800/60 shadow-xs"
                        : "text-slate-600 dark:text-[#929AAF] hover:bg-slate-100 dark:hover:bg-[#131722] hover:text-slate-900 dark:hover:text-[#F5F7FF]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "shrink-0 transition-colors",
                        collapsed ? "h-5 w-5" : "h-4 w-4",
                        isActive
                          ? "text-[#6C63FF] dark:text-[#42D9FF]"
                          : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-[#6C63FF]/20 text-[#6C63FF] dark:text-cyan-300 border border-[#6C63FF]/30">
                            {item.badge}
                          </span>
                        )}
                        {isActive && !item.badge && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6C63FF] dark:bg-[#42D9FF] shrink-0" />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Controls & Sign Out */}
      <div className="pt-3 border-t border-slate-200 dark:border-[#262C3A] space-y-2">
        {!collapsed && (
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50/80 to-violet-50/80 dark:from-[#131722] dark:to-[#1A1F2E] border border-indigo-100 dark:border-[#262C3A]">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6C63FF] dark:text-cyan-400 uppercase tracking-wider">
              <Activity className="w-3 h-3 animate-pulse" /> Closed-Loop AI
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#929AAF] mt-0.5">10-stage autonomous engine active</p>
          </div>
        )}

        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
          <ThemeToggle variant={collapsed ? "icon" : "pill"} />
        </div>

        <button
          onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center rounded-xl text-xs font-semibold text-slate-600 dark:text-[#929AAF] hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer",
            collapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-rose-500" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
