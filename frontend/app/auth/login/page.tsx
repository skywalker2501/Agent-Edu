"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sparkles, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role") || params.get("demo");
    const redirectParam = params.get("redirect") || undefined;
    if (roleParam) {
      if (roleParam === "teacher" || roleParam === "admin" || roleParam === "student_rahul" || roleParam === "student_priya") {
        handleDemo(roleParam as any, redirectParam);
      } else if (roleParam === "student") {
        handleDemo("student_rahul", redirectParam);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem("agentedu_user");
      const userObj = stored ? JSON.parse(stored) : null;
      let dest = "/student/dashboard";
      if (userObj?.role === "teacher") {
        dest = "/teacher/dashboard";
      } else if (userObj?.role === "admin") {
        dest = "/admin/dashboard";
      }
      window.location.href = dest;
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };

  const handleDemo = async (
    role: "student_rahul" | "student_priya" | "teacher" | "admin",
    targetDest?: string
  ) => {
    setError(null);
    setDemoLoading(role);
    try {
      await loginAsDemo(role);
      let dest = targetDest || "/student/dashboard";
      if (!targetDest) {
        if (role === "teacher") {
          dest = "/teacher/dashboard";
        } else if (role === "admin") {
          dest = "/admin/dashboard";
        }
      }
      window.location.href = dest;
    } catch (err: any) {
      setError(err?.message || "Demo login failed. Ensure the backend server is running.");
      setDemoLoading(null);
    }
  };

  const demoAccounts = [
    { role: "student_rahul" as const, label: "Rahul (Student)", email: "rahul@agentedu.org", color: "indigo", desc: "Recursion remediation journey" },
    { role: "student_priya" as const, label: "Priya (Student)", email: "priya@agentedu.org", color: "violet", desc: "Alternative solution accepted" },
    { role: "teacher" as const, label: "Dr. Alan Turing (Teacher)", email: "teacher@agentedu.org", color: "emerald", desc: "Review queue & simulator" },
    { role: "admin" as const, label: "Platform Admin", email: "admin@agentedu.org", color: "amber", desc: "System & audit oversight" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">AgentEdu</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Sign in to your portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Agentic Adaptive Learning — Powered by 6 Cognitive AI Agents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Manual Login Form */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
            <h2 className="text-base font-bold text-white">Sign in with credentials</h2>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agentedu.org"
                  required
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-indigo-400 font-semibold hover:text-indigo-300">
                Create one
              </Link>
            </p>
          </div>

          {/* Right: 1-Click Demo Account Switcher */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">1-Click Demo Access</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Instantly explore any portal role using seeded demo accounts.
              </p>
            </div>

            <div className="space-y-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleDemo(account.role)}
                  disabled={!!demoLoading}
                  className="w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 transition cursor-pointer disabled:opacity-60 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{account.label}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{account.email}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{account.desc}</p>
                    </div>
                    {demoLoading === account.role ? (
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          AgentEdu is a closed-loop adaptive learning platform. All data is locally seeded and no real student data is stored.
        </p>
      </div>
    </div>
  );
}
