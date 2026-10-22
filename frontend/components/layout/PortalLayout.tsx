"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { SimulationPanel } from "@/components/SimulationPanel";
import { UserRole } from "@/lib/types";

interface PortalLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function PortalLayout({ children, allowedRoles }: PortalLayoutProps) {
  const { user, isLoading, loginAsDemo } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const rolesKey = allowedRoles?.join(",") || "";

  const [isSwitching, setIsSwitching] = useState(false);

  // Auto-login fallback if user state is empty
  useEffect(() => {
    if (!isLoading && !user) {
      let targetRole: "student_rahul" | "student_priya" | "teacher" | "admin" = "student_rahul";
      if (pathname.startsWith("/admin")) {
        targetRole = "admin";
      } else if (pathname.startsWith("/teacher")) {
        targetRole = "teacher";
      } else {
        targetRole = "student_rahul";
      }
      loginAsDemo(targetRole).catch(() => {
        window.location.href = "/auth/login";
      });
    }
  }, [user, isLoading, pathname]);

  // Auto-switch demo persona seamlessly when navigating to portal with specific role requirement
  useEffect(() => {
    if (isLoading || !user || !allowedRoles) return;
    const hasRole = allowedRoles.includes(user.role) || user.role === "admin";
    if (!hasRole) {
      const isDemoUser =
        user.email?.includes("agentedu.org") ||
        user.email?.includes("demo") ||
        user.id?.startsWith("demo-");

      if (isDemoUser) {
        let targetDemo: "student_rahul" | "teacher" | "admin" = "student_rahul";
        if (pathname.startsWith("/admin") || allowedRoles.includes("admin")) {
          targetDemo = "admin";
        } else if (pathname.startsWith("/teacher") || allowedRoles.includes("teacher")) {
          targetDemo = "teacher";
        } else {
          targetDemo = "student_rahul";
        }
        setIsSwitching(true);
        loginAsDemo(targetDemo)
          .then(() => {
            router.refresh();
          })
          .catch((err) => {
            console.warn("Auto-switch demo persona notice:", err);
          })
          .finally(() => {
            setIsSwitching(false);
          });
      }
    }
  }, [user, isLoading, rolesKey, pathname]);

  // Real-time student activity heartbeat to teacher radar
  useEffect(() => {
    if (!user || user.role !== "student") return;

    const getFriendlyActivityLabel = (path: string): string => {
      if (path.includes("/assessments")) return "Taking / Reviewing Assessment";
      if (path.includes("/games")) return "Playing Games & Skill Challenges";
      if (path.includes("/classes")) return "In Classes & Sessions";
      if (path.includes("/live-class")) return "Attending Live Online Classroom";
      if (path.includes("/ai-tutor")) return "Studying with AI Socratic Tutor";
      if (path.includes("/misconceptions")) return "Analyzing Cognitive Misconceptions";
      if (path.includes("/knowledge-map")) return "Exploring Knowledge Graph";
      if (path.includes("/syllabus")) return "Reading Syllabus & Mastery Nodes";
      if (path.includes("/interventions")) return "Working on Remedial Practice";
      if (path.includes("/leaderboard")) return "Checking Global Leaderboard";
      return "Active on Dashboard";
    };

    const sendTelemetry = () => {
      const currentPath = pathname || "/student/dashboard";
      const activity = getFriendlyActivityLabel(currentPath);
      api.sendHeartbeat(currentPath, activity).catch(() => {});
    };

    sendTelemetry();
    const interval = setInterval(sendTelemetry, 15000); // Heartbeat every 15s
    return () => clearInterval(interval);
  }, [user, pathname]);

  if (isLoading || !user || isSwitching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold">{isSwitching ? "Switching workspace role…" : "Loading AgentEdu portal…"}</p>
        </div>
      </div>
    );
  }

  // Admins have universal oversight across student, teacher, and admin portals
  const hasAccess = !allowedRoles || allowedRoles.includes(user.role) || user.role === "admin";

  if (!hasAccess) {
    const requiredRole = allowedRoles[0];
    const handleSwitch = async (targetRole: "student_rahul" | "teacher" | "admin") => {
      setIsSwitching(true);
      try {
        await loginAsDemo(targetRole);
        router.refresh();
      } catch {
        window.location.reload();
      } finally {
        setIsSwitching(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
            🛡️
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {requiredRole === "teacher" ? "Teacher Workspace" : requiredRole === "admin" ? "Admin Console" : "Student Portal"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            You are signed in as <span className="font-bold capitalize text-slate-900 dark:text-slate-100">{user.full_name}</span> ({user.role}). This section requires a{" "}
            <span className="font-bold capitalize text-indigo-600 dark:text-indigo-400">{requiredRole}</span> role.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {requiredRole === "teacher" && (
              <button
                type="button"
                onClick={() => handleSwitch("teacher")}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Switch to Teacher Demo (Prof. Alan Turing)
              </button>
            )}
            {requiredRole === "student" && (
              <button
                type="button"
                onClick={() => handleSwitch("student_rahul")}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Switch to Student Demo (Rahul Gupta)
              </button>
            )}
            {requiredRole === "admin" && (
              <button
                type="button"
                onClick={() => handleSwitch("admin")}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Switch to Admin Demo (Dr. Eleanor Vance)
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                window.location.href =
                  user.role === "teacher"
                    ? "/teacher/dashboard"
                    : user.role === "admin"
                    ? "/admin/dashboard"
                    : "/student/dashboard";
              }}
              className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Go to my {user.role} dashboard instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="p-5 md:p-8 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      {/* Floating Live Simulation Panel — visible on all pages */}
      <SimulationPanel />
    </div>
  );
}
