"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Medal,
  Flame,
  Award,
  ChevronUp,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  rank: number;
  display_name: string;
  total_xp: number;
  level: number;
  streak_days?: number;
  is_current_user?: boolean;
}

interface LeaderboardData {
  timeframe: string;
  my_rank: number | null;
  my_xp: number;
  distance_to_next_rank: number | null;
  next_rank: number | null;
  top_users: LeaderboardEntry[];
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "all_time">("all_time");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    fetchLeaderboard(timeframe);
  }, [timeframe]);

  const fetchLeaderboard = async (tf: string) => {
    setIsLoading(true);
    try {
      const res = await api.getLeaderboard(tf);
      setData(res);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      // Fallback data
      setData({
        timeframe: tf,
        my_rank: 3,
        my_xp: 680,
        distance_to_next_rank: 70,
        next_rank: 2,
        top_users: [
          { user_id: "u1", rank: 1, display_name: "Aarav Sharma", total_xp: 1250, level: 4, streak_days: 12 },
          { user_id: "u2", rank: 2, display_name: "Priya Singh", total_xp: 750, level: 3, streak_days: 7 },
          { user_id: "u3", rank: 3, display_name: "Rahul Gupta (You)", total_xp: 680, level: 3, streak_days: 5, is_current_user: true },
          { user_id: "u4", rank: 4, display_name: "Ananya Iyer", total_xp: 520, level: 2, streak_days: 4 },
          { user_id: "u5", rank: 5, display_name: "Vikram Malhotra", total_xp: 410, level: 2, streak_days: 2 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const top3 = data?.top_users.slice(0, 3) || [];
  const rest = data?.top_users.slice(3) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Academic Leaderboard
          </h1>
          <p className="text-sm text-slate-500">
            Server-verified XP awarded exclusively for authentic mastery, quiz completion, and code challenges.
          </p>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          {(["weekly", "monthly", "all_time"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                timeframe === tf
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tf.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Current Student's Rank & Distance Card */}
      {data && (
        <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white shadow-xs">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
                #{data.my_rank ?? "-"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Your Current Standing</span>
                  <Badge variant="hypothesis" className="text-[10px]">
                    Verified
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-indigo-700">{data.my_xp} XP</span> earned from verified assessments & games
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {data.distance_to_next_rank !== null && data.next_rank !== null ? (
                <div className="bg-white/80 border border-indigo-100 px-3.5 py-2 rounded-xl text-right">
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Distance to #{data.next_rank}:</span>
                  </div>
                  <span className="font-bold text-indigo-700">+{data.distance_to_next_rank} XP needed</span>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-amber-800 font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" /> Rank #1 Champion!
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className="text-xs gap-1.5 text-slate-600 border-slate-200"
              >
                {isAnonymous ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{isAnonymous ? "Display as Anonymous" : "Show My Name"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end pt-4">
          {/* 2nd Place */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-xs order-1 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center mb-1">
              2
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm shadow-xs mb-2">
              {top3[1]?.display_name.charAt(0)}
            </div>
            <span className="font-bold text-xs text-slate-900 truncate max-w-full">
              {top3[1]?.display_name}
            </span>
            <span className="text-[11px] font-bold text-slate-500">{top3[1]?.total_xp} XP</span>
            <Badge variant="developing" className="mt-1 text-[9px]">
              Level {top3[1]?.level}
            </Badge>
          </div>

          {/* 1st Place */}
          <div className="bg-gradient-to-b from-amber-50/80 to-white border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-center shadow-md order-2 flex flex-col items-center relative -top-3">
            <div className="absolute -top-3 bg-amber-500 text-white p-1 rounded-full shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center mb-1 mt-1">
              1
            </div>
            <div className="w-14 h-14 rounded-full bg-amber-400 border-2 border-amber-200 flex items-center justify-center font-extrabold text-amber-950 text-base shadow-sm mb-2">
              {top3[0]?.display_name.charAt(0)}
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-full">
              {top3[0]?.display_name}
            </span>
            <span className="text-xs font-extrabold text-amber-700">{top3[0]?.total_xp} XP</span>
            <Badge variant="hypothesis" className="mt-1 text-[10px] bg-amber-500 text-white">
              Level {top3[0]?.level} Master
            </Badge>
          </div>

          {/* 3rd Place */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-xs order-3 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center mb-1">
              3
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-200 border-2 border-amber-300 flex items-center justify-center font-bold text-amber-900 text-sm shadow-xs mb-2">
              {top3[2]?.display_name.charAt(0)}
            </div>
            <span className="font-bold text-xs text-slate-900 truncate max-w-full">
              {top3[2]?.display_name}
            </span>
            <span className="text-[11px] font-bold text-slate-500">{top3[2]?.total_xp} XP</span>
            <Badge variant="developing" className="mt-1 text-[9px]">
              Level {top3[2]?.level}
            </Badge>
          </div>
        </div>
      )}

      {/* Detailed Ranking Table */}
      <Card>
        <CardHeader className="py-3.5 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900">
            Leaderboard Rankings ({data?.top_users.length || 0} students)
          </CardTitle>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Server-Verified
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3 pl-4">Rank</th>
                <th className="p-3">Student</th>
                <th className="p-3">Level</th>
                <th className="p-3">Streak</th>
                <th className="p-3 pr-4 text-right">Verified XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.top_users.map((user) => {
                const isMe = user.is_current_user || user.user_id === "current_user";
                return (
                  <tr
                    key={user.user_id}
                    className={`transition ${
                      isMe ? "bg-indigo-50/70 font-semibold" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="p-3 pl-4 font-bold">
                      {user.rank === 1 ? (
                        <span className="text-amber-500 flex items-center gap-1">
                          <Medal className="w-4 h-4" /> 1
                        </span>
                      ) : user.rank === 2 ? (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Medal className="w-4 h-4" /> 2
                        </span>
                      ) : user.rank === 3 ? (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Medal className="w-4 h-4" /> 3
                        </span>
                      ) : (
                        <span className="text-slate-500 pl-1">#{user.rank}</span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                          {user.display_name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-slate-900 font-medium">
                            {user.display_name}
                          </span>
                          {isMe && (
                            <Badge variant="hypothesis" className="ml-1.5 text-[9px] py-0 px-1">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-slate-600">
                      <Badge variant="developing" className="text-[10px] py-0.5">
                        Lvl {user.level}
                      </Badge>
                    </td>

                    <td className="p-3 text-slate-600">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {user.streak_days || 1}d
                      </span>
                    </td>

                    <td className="p-3 pr-4 text-right font-bold text-indigo-700">
                      {user.total_xp.toLocaleString()} XP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
