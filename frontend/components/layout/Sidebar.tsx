"use client";

import React from "react";
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
  MapPin,
  Radio,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";


export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role;

  // Student Links
  const studentNav = [
    { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { title: "My Classes", href: "/student/classes", icon: GraduationCap },
    { title: "Assessments", href: "/student/assessments", icon: ClipboardList },
    { title: "Syllabus Tree", href: "/student/syllabus", icon: BookOpen },
    { title: "Learn & Play Hub", href: "/student/games", icon: Gamepad2 },
    { title: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
    { title: "Knowledge Map", href: "/student/knowledge-map", icon: Network },
    { title: "My Misconceptions", href: "/student/misconceptions", icon: BrainCircuit },
    { title: "Interventions", href: "/student/interventions", icon: CheckCircle2 },
    { title: "Socratic AI Tutor", href: "/student/ai-tutor", icon: Bot },
    { title: "Learning History", href: "/student/history", icon: History },
  ];

  // Teacher Links
  const teacherNav = [
    { title: "Teacher Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
    { title: "Classes & Rosters", href: "/teacher/classes", icon: Users },
    { title: "Live Student Radar", href: "/teacher/student-radar", icon: Radio },
    { title: "Review Queue", href: "/teacher/review-queue", icon: ClipboardList },
    { title: "Misconception Review", href: "/teacher/misconceptions", icon: BrainCircuit },
    { title: "Intervention Simulator", href: "/teacher/simulator", icon: Sliders },
    { title: "Outcome Monitoring", href: "/teacher/outcomes", icon: Compass },
    { title: "Decision History", href: "/teacher/decision-history", icon: History },
  ];

  // Admin Links
  const adminNav = [
    { title: "System Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "User Directory", href: "/admin/users", icon: Users },
    { title: "Audit Trail", href: "/admin/audit", icon: ShieldAlert },
  ];

  const currentNav =
    role === "teacher"
      ? teacherNav
      : role === "admin"
      ? adminNav
      : studentNav;

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 min-h-screen flex flex-col justify-between p-4 sticky top-0 h-screen select-none shadow-sm">
      <div>
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 mb-6 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">
              AgentEdu
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
              Cognitive AI Education
            </span>
          </div>
        </Link>

        {/* User Role Badge */}
        <div className="px-3 mb-4">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user.full_name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{user.role} Portal</p>
            </div>
            <Badge
              variant={
                role === "teacher"
                  ? "confirmed"
                  : role === "admin"
                  ? "hypothesis"
                  : "mastered"
              }
              className="text-[10px] uppercase font-bold shrink-0"
            >
              {role}
            </Badge>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-0.5">
          <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Navigation
          </p>
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                  )}
                />
                <span className="truncate">{item.title}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
        <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border border-indigo-100 dark:border-indigo-800/30 mb-2">
          <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
            Closed-Loop Engine
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">10-stage pipeline active</p>
        </div>
        <ThemeToggle variant="pill" className="mb-2" />
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
        >

          <LogOut className="h-4 w-4 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
