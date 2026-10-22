"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";
import {
  Bell, Sparkles, ArrowRightLeft, Sun, Moon, Monitor, ChevronDown
} from "lucide-react";
import { NotificationItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loginAsDemo } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);


  const handleSwitchDemo = async (role: "student_rahul" | "student_priya" | "teacher" | "admin") => {
    await loginAsDemo(role);
    if (role === "teacher") {
      router.push("/teacher/dashboard");
    } else if (role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/student/dashboard");
    }
  };

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(setNotifications)
        .catch(() => {});
    }
  }, [user, pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notifications-dropdown]")) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Build breadcrumb
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumb = segments.map((seg, i) => ({
    label: seg.replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <header className="h-16 border-b border-slate-200 dark:border-[#262C3A] bg-white/95 dark:bg-[#0B0D12]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Breadcrumb / Title Context */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-[#929AAF] min-w-0">
        {breadcrumb.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-300 dark:text-[#262C3A]">/</span>}
            <span
              className={`capitalize truncate ${
                i === breadcrumb.length - 1
                  ? "font-bold text-slate-900 dark:text-[#F5F7FF]"
                  : "text-slate-500 dark:text-[#929AAF] hover:text-slate-700 dark:hover:text-[#F5F7FF]"
              }`}
            >
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Quick Demo Switcher */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#131722] rounded-xl border border-slate-200 dark:border-[#262C3A] text-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-[#929AAF] px-1.5 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3 text-[#6C63FF]" /> Demo:
          </span>
          {[
            { key: "student_rahul" as const, label: "Rahul" },
            { key: "student_priya" as const, label: "Priya" },
            { key: "teacher" as const, label: "Teacher" },
            { key: "admin" as const, label: "Admin" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSwitchDemo(key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                user?.email?.includes(label.toLowerCase()) || (key === "student_rahul" && user?.email === "rahul@agentedu.org")
                  ? "bg-[#6C63FF] text-white shadow-xs"
                  : "bg-white dark:bg-[#181C28] hover:bg-slate-50 dark:hover:bg-[#1E2433] text-slate-700 dark:text-[#929AAF]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Direct 1-Click Dark / Light Mode Toggle */}
        <ThemeToggle variant="icon" />

        {/* Notifications */}
        <div className="relative" data-notifications-dropdown>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 dark:text-[#929AAF] hover:text-slate-900 dark:hover:text-[#F5F7FF] hover:bg-slate-100 dark:hover:bg-[#131722] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0B0D12]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-2xl p-3.5 z-50 animate-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-[#262C3A]">
                <span className="text-xs font-bold text-slate-900 dark:text-[#F5F7FF]">Notifications</span>
                <span className="text-[10px] text-slate-400 font-medium">{unreadCount} unread</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl text-xs space-y-1 border ${
                        n.is_read
                          ? "bg-slate-50 dark:bg-[#181C28] border-slate-100 dark:border-[#262C3A]"
                          : "bg-indigo-50/70 dark:bg-[#1E1B4B]/40 border-indigo-100 dark:border-indigo-800/40"
                      }`}
                    >
                      <p className="font-bold text-slate-900 dark:text-[#F5F7FF]">{n.title}</p>
                      <p className="text-slate-600 dark:text-[#929AAF] leading-relaxed text-[11px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-[#262C3A]">
            <div className="w-8 h-8 rounded-full bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#6C63FF] dark:text-[#42D9FF] font-black flex items-center justify-center text-xs">
              {user.full_name.charAt(0)}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-bold text-slate-900 dark:text-[#F5F7FF] leading-tight">{user.full_name}</p>
              <p className="text-[10px] text-slate-500 dark:text-[#929AAF] capitalize font-medium">{user.role}</p>
            </div>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#5b52f0] px-3.5 py-1.5 rounded-xl transition shadow-xs"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
