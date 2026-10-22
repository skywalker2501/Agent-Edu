"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  variant?: "icon" | "button" | "pill";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
          isDark
            ? "bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
            : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200/70 hover:border-slate-300"
        } ${className}`}
        aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
        title={`Currently in ${isDark ? "Dark" : "Light"} mode. Click to toggle.`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isDark
                ? "bg-indigo-900/40 text-indigo-400"
                : "bg-amber-100 text-amber-600 shadow-sm"
            }`}
          >
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold block leading-tight">
              {isDark ? "Dark Mode" : "Light Mode"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              Click to switch
            </span>
          </div>
        </div>

        {/* Sliding Pill Switch */}
        <div
          className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative flex items-center ${
            isDark ? "bg-indigo-600" : "bg-slate-300"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
              isDark ? "translate-x-5" : "translate-x-0"
            }`}
          >
            {isDark ? (
              <Moon className="w-3 h-3 text-indigo-600" />
            ) : (
              <Sun className="w-3 h-3 text-amber-500" />
            )}
          </div>
        </div>
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
          isDark
            ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
        } ${className}`}
        aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  // Default: compact icon button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer ${
        isDark
          ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:text-amber-200 hover:border-slate-600 shadow-sm"
          : "bg-white border-slate-200 text-indigo-600 hover:bg-slate-100 hover:text-indigo-700 shadow-sm"
      } ${className}`}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
