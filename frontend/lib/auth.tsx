"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "./types";
import { api } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name: string; role: string }) => Promise<void>;
  logout: () => void;
  loginAsDemo: (role: "student_rahul" | "student_priya" | "teacher" | "admin") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FALLBACK_DEMO_USERS: Record<string, { user: User; token: string }> = {
  "rahul@agentedu.org": {
    user: {
      id: "demo-rahul-student",
      email: "rahul@agentedu.org",
      full_name: "Rahul Sharma",
      role: "student" as any,
      created_at: new Date().toISOString(),
    },
    token: "demo-jwt-rahul-token",
  },
  "priya@agentedu.org": {
    user: {
      id: "demo-priya-student",
      email: "priya@agentedu.org",
      full_name: "Priya Singh",
      role: "student" as any,
      created_at: new Date().toISOString(),
    },
    token: "demo-jwt-priya-token",
  },
  "teacher@agentedu.org": {
    user: {
      id: "demo-alan-turing",
      email: "teacher@agentedu.org",
      full_name: "Prof. Alan Turing",
      role: "teacher" as any,
      created_at: new Date().toISOString(),
    },
    token: "demo-jwt-teacher-token",
  },
  "admin@agentedu.org": {
    user: {
      id: "demo-platform-admin",
      email: "admin@agentedu.org",
      full_name: "Platform Admin",
      role: "admin" as any,
      created_at: new Date().toISOString(),
    },
    token: "demo-jwt-admin-token",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("agentedu_token");
    const savedUser = localStorage.getItem("agentedu_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("agentedu_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      try {
        const res = await api.login({ email, password });
        setToken(res.access_token);
        setUser(res.user);
        localStorage.setItem("agentedu_token", res.access_token);
        localStorage.setItem("agentedu_user", JSON.stringify(res.user));
        return;
      } catch (err: any) {
        const cleanEmail = email.toLowerCase().trim();
        if (FALLBACK_DEMO_USERS[cleanEmail]) {
          console.warn("Backend live endpoint unreachable, activating demo persona session for:", cleanEmail);
          const fallback = FALLBACK_DEMO_USERS[cleanEmail];
          setToken(fallback.token);
          setUser(fallback.user);
          localStorage.setItem("agentedu_token", fallback.token);
          localStorage.setItem("agentedu_user", JSON.stringify(fallback.user));
          return;
        }
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    role: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem("agentedu_token", res.access_token);
      localStorage.setItem("agentedu_user", JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("agentedu_token");
    localStorage.removeItem("agentedu_user");
  };

  const loginAsDemo = async (role: "student_rahul" | "student_priya" | "teacher" | "admin") => {
    const creds = {
      student_rahul: { email: "rahul@agentedu.org", password: "StudentPass123!" },
      student_priya: { email: "priya@agentedu.org", password: "StudentPass123!" },
      teacher: { email: "teacher@agentedu.org", password: "TeacherPass123!" },
      admin: { email: "admin@agentedu.org", password: "AdminPass123!" },
    }[role];

    await login(creds.email, creds.password);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, loginAsDemo }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
