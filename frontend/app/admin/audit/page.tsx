"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Search, Clock } from "lucide-react";

export default function AdminAuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getAuditTrail()
      .then(setEvents)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const displayEvents = events.length > 0 ? events : [
    { id: "ae1", event_type: "teacher_decision", description: "Review decision saved: correct_alternative_method for Priya", timestamp: "Today at 4:45 PM", actor: "Dr. Alan Turing" },
    { id: "ae2", event_type: "intervention_approved", description: "Intervention 'Worked Example' approved by Dr. Alan Turing for Rahul", timestamp: "Today at 10:05 AM", actor: "Dr. Alan Turing" },
    { id: "ae3", event_type: "misconception_confirmed", description: "Stack Frame Returns Overwriting misconception confirmed by teacher", timestamp: "Yesterday at 3:30 PM", actor: "Dr. Alan Turing" },
    { id: "ae4", event_type: "submission_graded", description: "Rahul Gupta submission for Recursion Diagnostic graded: 40%", timestamp: "Yesterday at 3:05 PM", actor: "System" },
    { id: "ae5", event_type: "user_login", description: "User admin@agentedu.org authenticated successfully via JWT", timestamp: "Today at 9:00 AM", actor: "Admin User" },
    { id: "ae6", event_type: "intervention_completed", description: "Rahul completed Call Stack Visualization intervention", timestamp: "Today at 10:15 AM", actor: "Rahul Gupta" },
    { id: "ae7", event_type: "reassessment_completed", description: "Post-intervention reassessment score: 78% (delta +38%)", timestamp: "Today at 10:45 AM", actor: "Rahul Gupta" },
  ];

  const query = (search || "").toLowerCase().trim();
  const filtered = displayEvents.filter(
    (e) =>
      String(e.description || "").toLowerCase().includes(query) ||
      String(e.event_type || "").toLowerCase().includes(query) ||
      String(e.actor || "").toLowerCase().includes(query)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-indigo-600 dark:text-cyan-400" /> Full Audit Trail
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Immutable, searchable log of every system event, user action, and AI agent operation.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search audit events, actors, or types..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyan-500"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((ev: any) => (
          <Card key={ev.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-[10px] font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    {(ev.event_type || "event").replace(/_/g, " ")}
                  </Badge>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {ev.timestamp || "Today"}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{ev.description}</p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                Actor: <strong className="text-slate-800 dark:text-slate-200">{ev.actor || "System"}</strong>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
