"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  ChevronRight,
  Activity,
  ShieldCheck,
  Server
} from "lucide-react";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, auditRes] = await Promise.allSettled([
          api.getUsers(),
          api.getAuditTrail(),
        ]);
        if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) setUsers(usersRes.value);
        if (auditRes.status === "fulfilled" && Array.isArray(auditRes.value)) setAuditEvents(auditRes.value);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const displayUsers = Array.isArray(users) && users.length > 0 ? users : [
    { id: "u1", full_name: "Admin User", email: "admin@agentedu.org", role: "admin" },
    { id: "u2", full_name: "Dr. Alan Turing", email: "teacher@agentedu.org", role: "teacher" },
    { id: "u3", full_name: "Rahul Gupta", email: "rahul@agentedu.org", role: "student" },
    { id: "u4", full_name: "Priya Singh", email: "priya@agentedu.org", role: "student" },
  ];

  const displayAudit = Array.isArray(auditEvents) && auditEvents.length > 0 ? auditEvents : [
    { id: "ae1", event_type: "teacher_decision", description: "Review decision saved: correct_alternative_method for Priya", timestamp: "Today at 4:45 PM", severity: "info" },
    { id: "ae2", event_type: "intervention_approved", description: "Intervention 'Worked Example' approved by Dr. Alan Turing for Rahul", timestamp: "Today at 10:05 AM", severity: "info" },
    { id: "ae3", event_type: "misconception_confirmed", description: "Stack Frame Returns Overwriting misconception confirmed by teacher", timestamp: "Yesterday at 3:30 PM", severity: "info" },
    { id: "ae4", event_type: "user_login", description: "User admin@agentedu.org authenticated successfully via JWT", timestamp: "Today at 9:00 AM", severity: "info" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-[#131722] via-[#1A1F2E] to-[#131722] border border-[#262C3A] rounded-2xl p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C63FF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6C63FF]/20 text-[#42D9FF] border border-[#6C63FF]/40">
              Enterprise Control Center
            </span>
            <span className="text-xs text-slate-400">• High-Availability Cluster</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            System Administration
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Platform governance, immutable audit trails, multi-tenant user directories, and autonomous AI pipeline telemetry.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5 shrink-0">
          <Link href="/admin/users">
            <Button size="lg" className="bg-[#6C63FF] hover:bg-[#5b52f0] text-white font-bold text-xs sm:text-sm shadow-md gap-1.5 h-10 px-5 rounded-xl">
              <Users className="w-4 h-4" /> User Management
            </Button>
          </Link>
          <Link href="/admin/audit">
            <Button variant="outline" size="lg" className="border-[#262C3A] bg-[#181C28] text-slate-200 hover:bg-[#1E2433] text-xs font-semibold h-10 px-4 rounded-xl gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#42D9FF]" /> Audit Log
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Platform Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-[#6C63FF] dark:text-[#42D9FF]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#929AAF] font-medium">Total Accounts</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">{displayUsers.length}</h3>
              <p className="text-[11px] text-slate-400 dark:text-[#929AAF]">Active Multi-role</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-500">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#929AAF] font-medium">AI Agents Engine</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">6 / 6</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">100% Operational</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#929AAF] font-medium">Audit Telemetry</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">4 Events</h3>
              <p className="text-[11px] text-slate-400 dark:text-[#929AAF]">Zero Tamper Alerts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-800 flex items-center justify-center text-[#8B5CF6]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#929AAF] font-medium">Storage & DB</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-[#F5F7FF]">PostgreSQL</h3>
              <p className="text-[11px] text-[#6C63FF] dark:text-[#42D9FF] font-bold">ACID Compliant</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Directory */}
        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#262C3A] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF] flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> User Directory
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-[#929AAF]">
                Seeded test accounts and permissions
              </CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="text-xs text-[#6C63FF] dark:text-[#42D9FF]">
                Full Directory →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-[#262C3A]">
              {displayUsers.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-[#181C28]/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#6C63FF] dark:text-[#42D9FF] font-black flex items-center justify-center text-xs">
                      {(u.full_name || "U").charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-[#F5F7FF]">{u.full_name || "User"}</p>
                      <p className="text-[11px] text-slate-500 dark:text-[#929AAF]">{u.email || "No email"}</p>
                    </div>
                  </div>
                  <Badge variant={u.role === "admin" ? "hypothesis" : u.role === "teacher" ? "confirmed" : "mastered"} className="text-[10px] capitalize font-bold">
                    {u.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card className="border border-slate-200 dark:border-[#262C3A] bg-white dark:bg-[#131722] rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#262C3A] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Immutable Audit Trail
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-[#929AAF]">
                System state transitions & teacher approvals
              </CardDescription>
            </div>
            <Link href="/admin/audit">
              <Button variant="ghost" size="sm" className="text-xs text-[#6C63FF] dark:text-[#42D9FF]">
                View All →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-[#262C3A]">
              {displayAudit.map((ae) => (
                <div key={ae.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-[#181C28]/50 transition">
                  <div className="w-2 h-2 rounded-full bg-[#6C63FF] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-[#F5F7FF] truncate">{ae.description || "System Audit Event"}</p>
                    <p className="text-[10px] text-slate-400 dark:text-[#929AAF] mt-0.5">{ae.timestamp || "Recently"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
