"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Bell, Sparkles, UserCircle2, ArrowRightLeft } from "lucide-react";
import { NotificationItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Breadcrumb / Title Context */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-semibold text-slate-900 capitalize">
          {pathname.split("/")[1] || "AgentEdu"}
        </span>
        {pathname.split("/")[2] && (
          <>
            <span>/</span>
            <span className="capitalize text-slate-600">
              {pathname.split("/")[2].replace(/-/g, " ")}
            </span>
          </>
        )}
      </div>

      {/* Right Actions: Quick Switcher & Notifications */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Switcher */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" /> Demo as:
          </span>
          <button
            onClick={() => handleSwitchDemo("student_rahul")}
            className="px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 shadow-2xs font-medium cursor-pointer"
          >
            Rahul (Student)
          </button>
          <button
            onClick={() => handleSwitchDemo("student_priya")}
            className="px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 shadow-2xs font-medium cursor-pointer"
          >
            Priya (Student)
          </button>
          <button
            onClick={() => handleSwitchDemo("teacher")}
            className="px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 shadow-2xs font-medium cursor-pointer"
          >
            Alan (Teacher)
          </button>
          <button
            onClick={() => handleSwitchDemo("admin")}
            className="px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 shadow-2xs font-medium cursor-pointer"
          >
            Admin
          </button>
        </div>

        {/* Notifications Icon & Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {unreadCount} unread
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1"
                    >
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs">
              {user.full_name.charAt(0)}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">{user.full_name}</p>
              <p className="text-[11px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg bg-indigo-50"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
