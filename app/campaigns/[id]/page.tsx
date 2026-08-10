"use client";

import { useState, useEffect } from "react";
import { formatDuration, formatPhone } from "@/lib/utils";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Play, Pause, Phone, Clock, Sparkles, FileText, ChevronDown, ChevronUp, RefreshCw, Calendar, Mail, PhoneCall } from "lucide-react";
import { VOICE_LABEL } from "@/lib/voices";

const outcomeColors: Record<string, string> = {
  "demo-booked": "bg-green-100 text-green-700",
  "interested": "bg-blue-100 text-blue-700",
  "callback": "bg-yellow-100 text-yellow-700",
  "not-interested": "bg-gray-100 text-gray-600",
  "voicemail": "bg-purple-100 text-purple-700",
  "no-answer": "bg-gray-100 text-gray-600",
  "pending": "bg-gray-100 text-gray-500",
  "completed": "bg-gray-100 text-gray-600",
};

const outcomeLabel: Record<string, string> = {
  "demo-booked": "Demo Booked",
  "interested": "Interested",
  "callback": "Callback",
  "not-interested": "Didn't Pick Up",
  "voicemail": "Voicemail",
  "no-answer": "Didn't Pick Up",
  "pending": "In Progress",
  "completed": "Completed",
};

type AnyCall = {
  id: string;
  bland_call_id?: string;
  campaign_id: string;
  campaign_name: string;
  club_name: string;
  phone: string;
  status: string;
  outcome: string;
  duration: number;
  transcript: string | null;
  summary: string | null;
  recording_url?: string | null;
  started_at: string;
  contact_id?: string;
};

type Campaign = {
  id: string;
  name: string;
  description: string;
  status: string;
  script: string;
  voice_id: string;
  max_calls_per_day: number;
  call_time_start: string;
  call_time_end: string;
  contact_count?: number;
  calls_made?: number;
  demos_booked?: number;
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [calls, setCalls] = useState<AnyCall[]>([]);
  const [contactPrefs, setContactPrefs] = useState<Record<string, { method: string; value: string }>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tabs, setTabs] = useState<Record<string, "summary" | "transcript">>({});
  const [markingDemo, setMarkingDemo] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const real = await res.json();
      const [callsRes, contactsRes] = await Promise.all([
        fetch(`/api/calls?campaign_id=${id}`),
        fetch("/api/contacts"),
      ]);
      const liveCalls: AnyCall[] = await callsRes.json();
      const allContacts: Array<{ id: string; preferred_contact_method?: string; preferred_contact_value?: string }> = await contactsRes.json();

      // Map contact_id → preferred method/value for quick lookup
      const prefs: Record<string, { method: string; value: string }> = {};
      for (const c of allContacts) {
        if (c.preferred_contact_method) {
          prefs[c.id] = { method: c.preferred_contact_method, value: c.preferred_contact_value ?? "" };
        }
      }
      setContactPrefs(prefs);
      setCalls(liveCalls);
      setCampaign({
        ...real,
        contact_count: real.contacts?.length ?? 0,
        calls_made: liveCalls.length,
        demos_booked: liveCalls.filter((c) => c.outcome === "demo-booked").length,
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const toggleStatus = async (current: string) => {
    if (!campaign) return;
    const next = current === "active" ? "paused" : "active";
    setCampaign((p) => p ? { ...p, status: next } : p);
    await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  };

  const syncCalls = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch("/api/calls/sync", { method: "POST" });
    const data = await res.json();
    setSyncResult(`Synced ${data.synced} calls, sent ${data.emailed} follow-up${data.emailed !== 1 ? "s" : ""}.`);
    setSyncing(false);
    load();
  };

  const markDemoBooked = async (callId: string) => {
    setMarkingDemo(callId);
    await fetch(`/api/calls/${callId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: "demo-booked" }),
    });
    setCalls((prev) => prev.map((c) => c.id === callId ? { ...c, outcome: "demo-booked" } : c));
    setMarkingDemo(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />Loading...
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="p-6">
        <Link href="/campaigns" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <p className="mt-6 text-gray-500">Campaign not found.</p>
      </div>
    );
  }

  const demos = calls.filter((c) => c.outcome === "demo-booked").length;
  const demoRate = calls.length > 0 ? Math.round((demos / calls.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/campaigns" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              campaign.status === "active" ? "bg-green-100 text-green-700" :
              campaign.status === "paused" ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-600"
            }`}>{campaign.status}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{campaign.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={syncCalls}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Calls"}
          </button>
          {(campaign.status === "active" || campaign.status === "paused") && (
            <button
              onClick={() => toggleStatus(campaign.status)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border font-medium ${
                campaign.status === "active"
                  ? "border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                  : "border-green-200 text-green-700 hover:bg-green-50"
              }`}
            >
              {campaign.status === "active" ? <><Pause className="w-4 h-4" />Pause</> : <><Play className="w-4 h-4" />Resume</>}
            </button>
          )}
        </div>
      </div>

      {syncResult && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
          {syncResult}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Contacts", value: campaign.contact_count ?? calls.length },
          { label: "Calls Made", value: calls.length },
          { label: "Demos Booked", value: demos, green: true },
          { label: "Demo Rate", value: `${demoRate}%` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.green ? "text-green-600" : "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Script */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Call Script</h2>
        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed bg-gray-50 rounded-lg p-4">{campaign.script}</p>
        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          <span>Voice: <span className="text-gray-600 font-medium">{VOICE_LABEL[campaign.voice_id] ?? campaign.voice_id}</span></span>
          <span>Hours: <span className="text-gray-600 font-medium">{campaign.call_time_start}–{campaign.call_time_end}</span></span>
          <span>Max/day: <span className="text-gray-600 font-medium">{campaign.max_calls_per_day}</span></span>
        </div>
      </div>

      {/* Calls */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Calls ({calls.length})</h2>
        {calls.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            <Phone className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No calls yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => {
              const isOpen = expanded === call.id;
              const tab = tabs[call.id] ?? "summary";
              return (
                <div key={call.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50"
                    onClick={() => setExpanded((p) => p === call.id ? null : call.id)}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      call.outcome === "demo-booked" ? "bg-green-100" :
                      call.outcome === "no-answer" || call.outcome === "not-interested" ? "bg-gray-100" : "bg-blue-100"
                    }`}>
                      <Phone className={`w-4 h-4 ${
                        call.outcome === "demo-booked" ? "text-green-600" :
                        call.outcome === "no-answer" || call.outcome === "not-interested" ? "text-gray-400" : "text-blue-500"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{call.club_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${outcomeColors[call.outcome] ?? "bg-gray-100 text-gray-600"}`}>
                          {outcomeLabel[call.outcome] ?? call.outcome}
                        </span>
                        {call.contact_id && contactPrefs[call.contact_id] && (
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            contactPrefs[call.contact_id].method === "email"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-purple-50 text-purple-600"
                          }`}>
                            {contactPrefs[call.contact_id].method === "email"
                              ? <Mail className="w-3 h-3" />
                              : <PhoneCall className="w-3 h-3" />}
                            Follow up by {contactPrefs[call.contact_id].method}
                            {contactPrefs[call.contact_id].value ? `: ${contactPrefs[call.contact_id].value}` : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatPhone(call.phone)}</p>
                    </div>
                    <div className="text-right shrink-0 mr-2">
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />{formatDuration(call.duration)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(call.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 pb-5">
                      <div className="flex items-center justify-between mt-4 mb-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setTabs((p) => ({ ...p, [call.id]: "summary" }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "summary" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />AI Summary
                          </button>
                          <button
                            onClick={() => setTabs((p) => ({ ...p, [call.id]: "transcript" }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "transcript" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                          >
                            <FileText className="w-3.5 h-3.5" />Transcript
                          </button>
                        </div>
                        {call.outcome !== "demo-booked" && call.outcome !== "no-answer" && call.outcome !== "not-interested" && (
                          <button
                            onClick={() => markDemoBooked(call.id)}
                            disabled={markingDemo === call.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {markingDemo === call.id ? "Saving..." : "Mark Demo Booked"}
                          </button>
                        )}
                      </div>

                      {tab === "summary" && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI Summary</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{call.summary ?? "Summary not yet available — call may still be processing."}</p>
                        </div>
                      )}
                      {tab === "transcript" && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                            {call.transcript || "Transcript not yet available."}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
