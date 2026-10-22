"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Filter,
  History,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface ExtendedUser extends User {
  status?: "active" | "suspended" | "pending_deletion" | "deleted";
  suspended_reason?: string;
  suspended_at?: string;
  total_xp?: number;
}

interface AuditItem {
  id: string;
  action: string;
  user_id: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modal / action state
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "reactivate" | "role" | "delete" | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [newRole, setNewRole] = useState<string>("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uData, aData] = await Promise.allSettled([
        api.getUsers(),
        api.getAuditTrail(),
      ]);

      if (uData.status === "fulfilled" && uData.value) {
        setUsers(uData.value as ExtendedUser[]);
      } else {
        // Fallback demo users
        setUsers([
          { id: "u-admin", full_name: "Admin User", email: "admin@agentedu.org", role: "admin", status: "active", created_at: "2026-01-01" },
          { id: "u-teacher", full_name: "Dr. Alan Turing", email: "teacher@agentedu.org", role: "teacher", status: "active", created_at: "2026-01-01" },
          { id: "u-student1", full_name: "Rahul Gupta", email: "rahul@agentedu.org", role: "student", status: "active", created_at: "2026-01-01" },
          { id: "u-student2", full_name: "Priya Singh", email: "priya@agentedu.org", role: "student", status: "active", created_at: "2026-01-01" },
          { id: "u-susp", full_name: "Test Suspended", email: "badactor@agentedu.org", role: "student", status: "suspended", suspended_reason: "Repeated API rate-limit exploit", created_at: "2026-01-05" },
        ]);
      }

      if (aData.status === "fulfilled" && aData.value) {
        setAuditLogs(aData.value);
      } else {
        setAuditLogs([
          { id: "a1", action: "USER_SUSPEND", user_id: "u-admin", target_id: "u-susp", details: "Rate-limit exploit", created_at: new Date().toISOString() },
          { id: "a2", action: "LOGIN_SUCCESS", user_id: "u-admin", created_at: new Date(Date.now() - 3600000).toISOString() },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (targetUser: ExtendedUser, newStatus: "active" | "suspended") => {
    setIsSubmitting(true);
    try {
      await api.updateUserStatus(targetUser.id, newStatus, newStatus === "suspended" ? suspendReason : undefined);
      setFeedbackMsg({
        type: "success",
        text: `User ${targetUser.full_name} is now ${newStatus}.`,
      });
      setSelectedUser(null);
      setActionType(null);
      setSuspendReason("");
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err?.message || "Failed to update user status.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUser: ExtendedUser) => {
    setIsSubmitting(true);
    try {
      await api.updateUserRole(targetUser.id, newRole);
      setFeedbackMsg({
        type: "success",
        text: `Role for ${targetUser.full_name} updated to ${newRole}.`,
      });
      setSelectedUser(null);
      setActionType(null);
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err?.message || "Failed to update role.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (targetUser: ExtendedUser) => {
    setIsSubmitting(true);
    try {
      await api.deleteUserAccount(targetUser.id);
      setFeedbackMsg({
        type: "success",
        text: `User ${targetUser.full_name} has been soft-deleted. Learning records preserved in audit logs.`,
      });
      setSelectedUser(null);
      setActionType(null);
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err?.message || "Failed to delete user account.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter((u) => {
    const fullName = String(u?.full_name || "");
    const email = String(u?.email || "");
    const query = (search || "").toLowerCase();
    const matchSearch =
      fullName.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const currentStatus = u.status || "active";
    const matchStatus = statusFilter === "all" || currentStatus === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Administrative Security & User Directory
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Role-based authorization, account suspension, soft deletion, and security audit log.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="text-xs gap-1.5 self-start sm:self-auto border-slate-200 dark:border-slate-700 dark:text-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </Button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_deletion">Pending Deletion</option>
          </select>
        </div>
      </div>

      {/* User Directory Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-left text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3 pl-4">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined</th>
                <th className="p-3 pr-4 text-right">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((u) => {
                const userStatus = u.status || "active";
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 pl-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">{u.full_name || "User"}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{u.email}</span>
                        {u.suspended_reason && (
                          <span className="text-[10px] text-red-600 dark:text-red-400 block mt-0.5">
                            Reason: {u.suspended_reason}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <Badge
                        variant={u.role === "admin" ? "hypothesis" : u.role === "teacher" ? "confirmed" : "developing"}
                        className="capitalize text-[10px] font-bold"
                      >
                        {u.role}
                      </Badge>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          userStatus === "active"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : userStatus === "suspended"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                            : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            userStatus === "active" ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {userStatus}
                      </span>
                    </td>

                    <td className="p-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                      {String(u.created_at || "2026-01-01").slice(0, 10)}
                    </td>

                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Suspend / Reactivate */}
                        {userStatus === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] px-2 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType("suspend");
                            }}
                          >
                            <UserX className="w-3 h-3 mr-1" /> Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType("reactivate");
                            }}
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Reactivate
                          </Button>
                        )}

                        {/* Role Change */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] px-2 text-slate-600 border-slate-200"
                          onClick={() => {
                            setSelectedUser(u);
                            setNewRole(u.role);
                            setActionType("role");
                          }}
                        >
                          Role
                        </Button>

                        {/* Soft Delete */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] px-2 text-slate-400 hover:text-red-700 border-slate-200"
                          onClick={() => {
                            setSelectedUser(u);
                            setActionType("delete");
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Action Modal Overlay */}
      {selectedUser && actionType && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            {actionType === "suspend" && (
              <>
                <div className="flex items-center gap-2 text-red-600">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="font-bold text-base text-slate-900">Suspend User Account</h3>
                </div>
                <p className="text-xs text-slate-600">
                  Suspending <span className="font-semibold text-slate-900">{selectedUser.full_name}</span> will immediately invalidate API access on the backend.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Suspension Reason</label>
                  <input
                    type="text"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="e.g. Rate-limit abuse, policy violation..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
                    disabled={isSubmitting}
                    onClick={() => handleStatusChange(selectedUser, "suspended")}
                  >
                    Confirm Suspension
                  </Button>
                </div>
              </>
            )}

            {actionType === "reactivate" && (
              <>
                <div className="flex items-center gap-2 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-bold text-base text-slate-900">Reactivate Account</h3>
                </div>
                <p className="text-xs text-slate-600">
                  Restore active permissions for <span className="font-semibold text-slate-900">{selectedUser.full_name}</span>. The student or teacher will regain API access immediately.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                    disabled={isSubmitting}
                    onClick={() => handleStatusChange(selectedUser, "active")}
                  >
                    Reactivate Account
                  </Button>
                </div>
              </>
            )}

            {actionType === "role" && (
              <>
                <div className="flex items-center gap-2 text-indigo-600">
                  <Shield className="w-5 h-5" />
                  <h3 className="font-bold text-base text-slate-900">Assign Platform Role</h3>
                </div>
                <p className="text-xs text-slate-600">
                  Update role permissions for <span className="font-semibold text-slate-900">{selectedUser.full_name}</span>.
                </p>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher (Reviewer)</option>
                  <option value="admin">Administrator</option>
                </select>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                    disabled={isSubmitting}
                    onClick={() => handleRoleChange(selectedUser)}
                  >
                    Save Role Change
                  </Button>
                </div>
              </>
            )}

            {actionType === "delete" && (
              <>
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-base text-slate-900">Confirm Soft Deletion</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to soft-delete <span className="font-semibold text-slate-900">{selectedUser.full_name}</span>?
                  The account will be marked as deleted, all future logins blocked, but historical quiz assessments and XP audits will remain preserved for academic integrity.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs"
                    disabled={isSubmitting}
                    onClick={() => handleDeleteUser(selectedUser)}
                  >
                    Delete Account
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Security Audit Log */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <History className="w-3.5 h-3.5 text-indigo-600" /> Security Audit Log Trail
          </CardTitle>
          <span className="text-[10px] text-slate-400">Append-Only Immutable Records</span>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-slate-500 font-semibold text-[10px] uppercase">
                <th className="p-2.5 pl-4">Timestamp</th>
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Admin ID</th>
                <th className="p-2.5">Target ID</th>
                <th className="p-2.5 pr-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="text-slate-600 hover:bg-slate-50/50">
                  <td className="p-2.5 pl-4 font-mono text-[10px] text-slate-400">
                    {log.created_at?.slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="p-2.5 font-bold font-mono text-[10px] text-indigo-700">
                    {log.action}
                  </td>
                  <td className="p-2.5 font-mono text-[10px] text-slate-500">
                    {log.user_id?.slice(0, 8)}...
                  </td>
                  <td className="p-2.5 font-mono text-[10px] text-slate-500">
                    {log.target_id ? `${log.target_id.slice(0, 8)}...` : "-"}
                  </td>
                  <td className="p-2.5 pr-4 text-[11px] text-slate-700">
                    {log.details || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
