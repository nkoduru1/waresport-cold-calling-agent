"use client";

import { useState, useEffect } from "react";
import { formatDuration, formatPhone } from "@/lib/utils";
import { Search, Phone, Clock, ChevronDown, ChevronUp, FileText, Sparkles, RefreshCw } from "lucide-react";

const outcomeColors: Record<string, string> = {
  "demo-booked": "bg-green-100 text-green-700",
  "interested": "bg-blue-100 text-blue-700",
  "callback": "bg-yellow-100 text-yellow-700",
  "not-interested": "bg-gray-100 text-gray-600",
  "voicemail": "bg-purple-100 text-purple-700",
  "no-answer": "bg-gray-100 text-gray-600",
  "wrong-number": "bg-orange-100 text-orange-700",
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
  "wrong-number": "Wrong Number",
  "pending": "In Progress",
  "completed": "Completed",
};

type Call = {
  id: string;
  club_name: string;
  phone: string;
  outcome: string;
  duration: number;
  campaign_name: string;
  campaign_id: string;
  started_at: string;
  transcript: string | null;
  summary: string | null;
  recording_url: string | null;
};

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "transcript" | "summary">>({});

  const loadCalls = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calls");
      const live: Call[] = await res.json();
      setCalls(live);
      setIsLive(live.length > 0);
    } catch {
      setCalls([]);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCalls(); }, []);

  const filtered = calls.filter((c) => {
    const matchSearch =
      c.club_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.campaign_name.toLowerCase().includes(search.toLowerCase());
    const matchOutcome = outcomeFilter === "all" || c.outcome === outcomeFilter;
    return matchSearch && matchOutcome;
  });

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));
  const getTab = (id: string) => activeTab[id] ?? "summary";
  const setTab = (id: string, tab: "transcript" | "summary") =>
    setActiveTab((prev) => ({ ...prev, [id]: tab }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Calls</h1>
            {isLive && <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Live</span>}
          </div>
          <p className="text-gray-500 text-sm mt-1">{calls.length} calls recorded</p>
        </div>
        <button onClick={loadCalls} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by club, phone, campaign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
        >
          <option value="all">All Outcomes</option>
          <option value="demo-booked">Demo Booked</option>
          <option value="interested">Interested</option>
          <option value="callback">Callback</option>
          <option value="no-answer">Didn't Pick Up</option>
          <option value="voicemail">Voicemail</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Loading calls...
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((call) => {
            const isOpen = expanded === call.id;
            const tab = getTab(call.id);

            return (
              <div key={call.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggle(call.id)}
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{call.club_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${outcomeColors[call.outcome] ?? "bg-gray-100 text-gray-600"}`}>
                        {outcomeLabel[call.outcome] ?? call.outcome}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">{formatPhone(call.phone)}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{call.campaign_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />{formatDuration(call.duration)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(call.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 pb-5">
                    <div className="flex gap-1 mt-4 mb-4">
                      <button
                        onClick={() => setTab(call.id, "summary")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          tab === "summary" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />AI Summary
                      </button>
                      <button
                        onClick={() => setTab(call.id, "transcript")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          tab === "transcript" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />Full Transcript
                      </button>
                      {call.recording_url && (
                        <a
                          href={call.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100"
                        >
                          🎙 Recording
                        </a>
                      )}
                    </div>

                    {tab === "summary" && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI Summary</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {call.summary ?? "Summary not yet available — call may still be processing."}
                        </p>
                      </div>
                    )}

                    {tab === "transcript" && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-72 overflow-y-auto">
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

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Phone className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No calls yet. Launch a campaign to start calling.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
