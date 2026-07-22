"use client";

import { useEffect, useState } from "react";
import { mockAnalytics, mockCampaigns } from "@/lib/mock-data";
import { formatDuration, formatPhone } from "@/lib/utils";
import { Phone, TrendingUp, Calendar, Users, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import Link from "next/link";

const outcomeColors: Record<string, string> = {
  "demo-booked": "bg-green-100 text-green-700",
  "interested": "bg-blue-100 text-blue-700",
  "callback": "bg-yellow-100 text-yellow-700",
  "not-interested": "bg-red-100 text-red-700",
  "voicemail": "bg-purple-100 text-purple-700",
  "no-answer": "bg-gray-100 text-gray-600",
  "pending": "bg-gray-100 text-gray-500",
};

const outcomeLabel: Record<string, string> = {
  "demo-booked": "Demo Booked",
  "interested": "Interested",
  "callback": "Callback",
  "not-interested": "Not Interested",
  "voicemail": "Voicemail",
  "no-answer": "No Answer",
  "pending": "In Progress",
};

const PIE_COLORS: Record<string, string> = {
  "demo-booked": "#22c55e",
  "interested": "#3b82f6",
  "callback": "#f59e0b",
  "not-interested": "#ef4444",
  "voicemail": "#8b5cf6",
  "no-answer": "#6b7280",
  "pending": "#d1d5db",
};

type AnyCall = { id: string; club_name: string; phone: string; outcome: string; duration: number; campaign_name: string; started_at: string };

function computeStats(calls: AnyCall[]) {
  const total = calls.length;
  const answered = calls.filter((c) => c.outcome !== "no-answer" && c.outcome !== "pending").length;
  const demos = calls.filter((c) => c.outcome === "demo-booked").length;
  const pickupRate = total > 0 ? Math.round((answered / total) * 100) : 0;
  const demoRate = answered > 0 ? Math.round((demos / answered) * 100) : 0;
  return { total, answered, demos, pickupRate, demoRate };
}

function computeOutcomePie(calls: AnyCall[]) {
  const counts: Record<string, number> = {};
  calls.forEach((c) => { counts[c.outcome] = (counts[c.outcome] ?? 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({
    name: outcomeLabel[name] ?? name,
    value,
    color: PIE_COLORS[name] ?? "#9ca3af",
  }));
}

export default function Dashboard() {
  const [calls, setCalls] = useState<AnyCall[]>([]);
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [callsRes, campsRes] = await Promise.all([
        fetch("/api/calls"),
        fetch("/api/campaigns"),
      ]);
      const liveCalls: AnyCall[] = await callsRes.json();
      const liveCamps = await campsRes.json();

      setCalls(liveCalls);
      setIsLive(liveCalls.length > 0);

      if (liveCamps.length > 0) {
        const realIds = new Set(liveCamps.map((c: { id: string }) => c.id));
        setCampaigns([...liveCamps, ...mockCampaigns.filter((m) => !realIds.has(m.id))]);
      }
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const displayCalls = calls;
  const stats = computeStats(displayCalls);
  const piData = computeOutcomePie(displayCalls);
  const recentCalls = [...displayCalls].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()).slice(0, 5);

  const statCards = [
    { label: "Total Calls", value: String(stats.total), change: "All time", icon: Phone, color: "bg-blue-500" },
    { label: "Pickup Rate", value: `${stats.pickupRate}%`, change: `${stats.answered} answered`, icon: TrendingUp, color: "bg-green-500" },
    { label: "Demos Booked", value: String(stats.demos), change: "All campaigns", icon: Calendar, color: "bg-purple-500" },
    { label: "Demo Rate", value: `${stats.demoRate}%`, change: "of answered calls", icon: Users, color: "bg-orange-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {isLive
              ? <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Live</span>
              : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Demo data</span>
            }
          </div>
          <p className="text-gray-500 text-sm mt-1">Overview of your cold calling activity</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Chart — use mock daily data (real-time daily bucketing needs a DB) */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Daily Call Activity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockAnalytics.daily_calls}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip />
              <Area type="monotone" dataKey="calls" stroke="#3b82f6" fill="#dbeafe" name="Calls" />
              <Area type="monotone" dataKey="pickups" stroke="#22c55e" fill="#dcfce7" name="Pickups" />
              <Area type="monotone" dataKey="demos" stroke="#a855f7" fill="#f3e8ff" name="Demos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Outcome Pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Call Outcomes</h2>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={piData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                {piData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} calls`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {piData.slice(0, 4).map((o) => (
              <div key={o.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: o.color }} />
                  <span className="text-gray-500">{o.name}</span>
                </div>
                <span className="font-medium text-gray-700">{o.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Campaigns</h2>
          <Link href="/campaigns" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="space-y-3">
          {campaigns.filter((c) => c.status === "active" || c.status === "paused").slice(0, 3).map((c) => {
            const count = (c as any).contact_count ?? (c as any).contacts?.length ?? 0;
            const made = (c as any).calls_made ?? 0;
            return (
              <div key={c.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">{made} calls made · {(c as any).demos_booked ?? 0} demos booked</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {count > 0 && (
                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((made / count) * 100, 100)}%` }} />
                    </div>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Calls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Recent Calls</h2>
          <Link href="/calls" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 text-left border-b border-gray-100">
              <th className="pb-2 font-medium">Club</th>
              <th className="pb-2 font-medium">Phone</th>
              <th className="pb-2 font-medium">Duration</th>
              <th className="pb-2 font-medium">Outcome</th>
              <th className="pb-2 font-medium">Campaign</th>
            </tr>
          </thead>
          <tbody>
            {recentCalls.map((call) => (
              <tr key={call.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5 text-sm font-medium text-gray-800">{call.club_name}</td>
                <td className="py-2.5 text-sm text-gray-500">{formatPhone(call.phone)}</td>
                <td className="py-2.5 text-sm text-gray-500">{formatDuration(call.duration)}</td>
                <td className="py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${outcomeColors[call.outcome] ?? "bg-gray-100 text-gray-600"}`}>
                    {outcomeLabel[call.outcome] ?? call.outcome}
                  </span>
                </td>
                <td className="py-2.5 text-xs text-gray-400 truncate max-w-[120px]">{call.campaign_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
