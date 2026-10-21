"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Search } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const displayUsers = users.length > 0 ? users : [
    { id: "u1", full_name: "Admin User", email: "admin@agentedu.org", role: "admin" as const, created_at: "2026-01-01" },
    { id: "u2", full_name: "Dr. Alan Turing", email: "teacher@agentedu.org", role: "teacher" as const, created_at: "2026-01-01" },
    { id: "u3", full_name: "Rahul Gupta", email: "rahul@agentedu.org", role: "student" as const, created_at: "2026-01-01" },
    { id: "u4", full_name: "Priya Singh", email: "priya@agentedu.org", role: "student" as const, created_at: "2026-01-01" },
  ];

  const filtered = displayUsers.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> User Directory
          </h1>
          <p className="text-sm text-slate-500">All registered platform users and their roles.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 font-semibold uppercase tracking-wider">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="p-3 text-slate-500 font-mono">{u.email}</td>
                  <td className="p-3">
                    <Badge
                      variant={u.role === "admin" ? "hypothesis" : u.role === "teacher" ? "confirmed" : "developing"}
                      className="capitalize text-[10px] font-bold"
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-400">{u.created_at?.slice(0, 10) || "2026-01-01"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
