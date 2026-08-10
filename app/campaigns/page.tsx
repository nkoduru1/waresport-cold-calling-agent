"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Play, Pause, ChevronRight, RefreshCw, Trash2 } from "lucide-react";
import { VOICE_LABEL } from "@/lib/voices";

type Campaign = {
  id: string;
  name: string;
  description: string;
  status: string;
  voice_id: string;
  max_calls_per_day: number;
  call_time_start: string;
  call_time_end: string;
  contact_count: number;
  calls_made: number;
  demos_booked: number;
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-600",
  completed: "bg-blue-100 text-blue-700",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [campsRes, callsRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/calls"),
      ]);
      const real: Campaign[] = await campsRes.json();
      const allCalls: Array<{ campaign_id: string; outcome: string }> = await callsRes.json();

      const callsByCampaign: Record<string, { made: number; demos: number }> = {};
      allCalls.forEach((c) => {
        if (!callsByCampaign[c.campaign_id]) callsByCampaign[c.campaign_id] = { made: 0, demos: 0 };
        callsByCampaign[c.campaign_id].made++;
        if (c.outcome === "demo-booked") callsByCampaign[c.campaign_id].demos++;
      });

      setCampaigns(
        real.map((c) => ({
          ...c,
          contact_count: (c as any).contacts?.length ?? c.contact_count ?? 0,
          calls_made: callsByCampaign[c.id]?.made ?? 0,
          demos_booked: callsByCampaign[c.id]?.demos ?? 0,
        }))
      );
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "paused" : "active";
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: next } : c));
    try {
      await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
    } catch { /* optimistic update already applied */ }
  };

  const deleteCampaign = async (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setConfirmDelete(null);
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
  };

  const launch = async (id: string) => {
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: "active" } : c));
    await fetch(`/api/campaigns/${id}/launch`, { method: "POST" });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm mt-1">{campaigns.length} campaigns</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />New Campaign
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />Loading...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm font-medium">No campaigns yet.</p>
          <p className="text-xs mt-1">Create one to start making calls.</p>
          <Link href="/campaigns/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />New Campaign
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => {
            const progress = c.contact_count > 0 ? (c.calls_made / c.contact_count) * 100 : 0;
            const demoRate = c.calls_made > 0 ? Math.round((c.demos_booked / c.calls_made) * 100) : 0;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-semibold text-gray-900">{c.name}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{c.description}</p>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div><p className="text-xs text-gray-400">Contacts</p><p className="text-lg font-bold text-gray-800">{c.contact_count}</p></div>
                      <div><p className="text-xs text-gray-400">Calls Made</p><p className="text-lg font-bold text-gray-800">{c.calls_made}</p></div>
                      <div><p className="text-xs text-gray-400">Demos Booked</p><p className="text-lg font-bold text-green-600">{c.demos_booked}</p></div>
                      <div><p className="text-xs text-gray-400">Demo Rate</p><p className="text-lg font-bold text-gray-800">{demoRate}%</p></div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{c.calls_made} / {c.contact_count} contacts called</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span>{c.call_time_start}–{c.call_time_end}</span>
                      <span>Max {c.max_calls_per_day}/day</span>
                      <span>Voice: {VOICE_LABEL[c.voice_id] ?? c.voice_id}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {(c.status === "active" || c.status === "paused") && (
                      <button
                        onClick={() => toggleStatus(c.id, c.status)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border font-medium ${
                          c.status === "active"
                            ? "border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {c.status === "active" ? <><Pause className="w-4 h-4" />Pause</> : <><Play className="w-4 h-4" />Resume</>}
                      </button>
                    )}
                    {c.status === "draft" && (
                      <button
                        onClick={() => launch(c.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
                      >
                        <Play className="w-4 h-4" />Launch
                      </button>
                    )}
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                    >
                      View <ChevronRight className="w-4 h-4" />
                    </Link>
                    {confirmDelete === c.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => deleteCampaign(c.id)}
                          className="flex-1 px-2 py-2 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 px-2 py-2 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 font-medium"
                      >
                        <Trash2 className="w-4 h-4" />Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
