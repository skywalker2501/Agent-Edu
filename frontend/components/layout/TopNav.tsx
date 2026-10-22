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

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loginAsDemo } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

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
      if (!target.closest("[data-theme-dropdown]")) setShowThemeMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const themeOptions: { value: "light" | "dark" | "system"; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <Sun className="w-3.5 h-3.5" />, label: "Light" },
    { value: "dark", icon: <Moon className="w-3.5 h-3.5" />, label: "Dark" },
    { value: "system", icon: <Monitor className="w-3.5 h-3.5" />, label: "System" },
  ];

  const currentThemeIcon = theme === "dark" ? (
    <Moon className="w-4 h-4" />
  ) : theme === "light" ? (
    <Sun className="w-4 h-4" />
  ) : (
    <Monitor className="w-4 h-4" />
  );

  // Build breadcrumb
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumb = segments.map((seg, i) => ({
    label: seg.replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Breadcrumb / Title Context */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 min-w-0">
        {breadcrumb.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
            <span
              className={`capitalize truncate ${
                i === breadcrumb.length - 1
                  ? "font-semibold text-slate-900 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Demo Switcher */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" /> Demo:
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
              className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                user?.email?.includes(label.toLowerCase()) || (key === "student_rahul" && user?.email === "rahul@agentedu.org")
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 shadow-sm"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Theme Toggle */}
        <div className="relative" data-theme-dropdown>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
            aria-label="Toggle theme"
            title={`Theme: ${theme}`}
          >
            {currentThemeIcon}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-1.5 z-50 animate-in">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                Appearance
              </p>
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTheme(opt.value); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    theme === opt.value
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {opt.icon} {opt.label}
                  {theme === opt.value && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" data-notifications-dropdown>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-3 z-50 animate-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
                <span className="text-[10px] text-slate-400 font-medium">{unreadCount} unread</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg text-xs space-y-1 border ${
                        n.is_read
                          ? "bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700"
                          : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800"
                      }`}
                    >
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs">
              {user.full_name.charAt(0)}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user.full_name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
