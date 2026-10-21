"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { UserRole } from "@/lib/types";

interface PortalLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function PortalLayout({ children, allowedRoles }: PortalLayoutProps) {
  const { user, isLoading, loginAsDemo } = useAuth();
  const router = useRouter();

  const rolesKey = allowedRoles?.join(",") || "";

  useEffect(() => {
    if (!isLoading && !user) {
      // Determine appropriate demo role based on required portal roles
      let targetRole: "student_rahul" | "student_priya" | "teacher" | "admin" = "student_rahul";
      if (allowedRoles?.includes("teacher")) {
        targetRole = "teacher";
      } else if (allowedRoles?.includes("admin")) {
        targetRole = "admin";
      }
      loginAsDemo(targetRole).catch(() => {
        window.location.href = "/auth/login";
      });
    }
  }, [user, isLoading, rolesKey]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Loading AgentEdu portal...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const requiredRole = allowedRoles[0];
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
            🛡️
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {requiredRole === "teacher" ? "Teacher Workspace" : requiredRole === "admin" ? "Admin Console" : "Student Portal"}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are currently signed in as <span className="font-bold capitalize text-slate-900">{user.full_name}</span> ({user.role}). This section requires a <span className="font-bold capitalize text-indigo-600">{requiredRole}</span> role.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {requiredRole === "teacher" && (
              <button
                type="button"
                onClick={async () => {
                  await loginAsDemo("teacher");
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Switch to Teacher Demo (Prof. Alan Turing)
              </button>
            )}
            {requiredRole === "student" && (
              <button
                type="button"
                onClick={async () => {
                  await loginAsDemo("student_rahul");
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Switch to Student Demo (Rahul Gupta)
              </button>
            )}
            {requiredRole === "admin" && (
              <button
                type="button"
                onClick={async () => {
                  await loginAsDemo("admin");
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Switch to Admin Demo (Dr. Eleanor Vance)
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                window.location.href = (user.role === "teacher" ? "/teacher/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/student/dashboard");
              }}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Go to my {user.role} dashboard instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="p-6 md:p-8 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
