const BLAND_BASE = "https://api.bland.ai/v1";
const KEY = process.env.BLAND_AI_API_KEY!;

function headers() {
  return {
    Authorization: KEY,
    "Content-Type": "application/json",
  };
}

export interface BlandCallOptions {
  phone_number: string;
  task: string;
  voice?: string;
  record?: boolean;
  wait_for_greeting?: boolean;
  webhook?: string;
  max_duration?: number;
  from?: string;
  voicemail_message?: string;
  metadata?: Record<string, string>;
}

export interface BlandCall {
  call_id: string;
  status: string;
  created_at: string;
  ended_at?: string;
  call_length?: number;
  from?: string;
  to?: string;
  completed?: boolean;
  recording_url?: string;
  transcripts?: Array<{ id: string; user: string; text: string; created_at: string }>;
  summary?: string;
  analysis?: {
    outcome?: string;
    demo_booked?: boolean;
    interested?: boolean;
  };
  metadata?: Record<string, string>;
}

export async function makeCall(opts: BlandCallOptions): Promise<{ call_id: string; status: string }> {
  const res = await fetch(`${BLAND_BASE}/calls`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      phone_number: opts.phone_number,
      task: opts.task,
      voice: opts.voice ?? "maya",
      record: opts.record ?? true,
      wait_for_greeting: opts.wait_for_greeting ?? true,
      max_duration: opts.max_duration ?? 10,
      voicemail_action: "leave_message",
      voicemail_message: opts.voicemail_message ?? "Hi, this is an AI assistant calling from Waresport. We help sports clubs save 15 to 20 hours per week on admin work by managing registrations, scheduling, and payments all in one platform. I would love to show you a quick 15 minute demo. Please visit waresport.com or call us back. Thank you and have a great day!",
      webhook: opts.webhook,
      ...(opts.from ? { from: opts.from } : {}),
      metadata: opts.metadata ?? {},
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bland.ai error: ${err}`);
  }

  return res.json();
}

export async function getCall(callId: string): Promise<BlandCall> {
  const res = await fetch(`${BLAND_BASE}/calls/${callId}`, { headers: headers() });
  if (!res.ok) throw new Error(`Bland.ai getCall error: ${res.status}`);
  return res.json();
}

export async function listCalls(limit = 50): Promise<BlandCall[]> {
  const res = await fetch(`${BLAND_BASE}/calls?limit=${limit}`, { headers: headers() });
  if (!res.ok) throw new Error(`Bland.ai listCalls error: ${res.status}`);
  const data = await res.json();
  return data.calls ?? data ?? [];
}

export function formatTranscript(transcripts: BlandCall["transcripts"]): string {
  if (!transcripts || transcripts.length === 0) return "";
  return transcripts
    .map((t) => `${t.user === "assistant" ? "Agent" : "Contact"}: ${t.text}`)
    .join("\n\n");
}

export function inferOutcome(call: BlandCall): string {
  const summary = (call.summary ?? "").toLowerCase();
  if (call.analysis?.demo_booked || summary.includes("demo") && summary.includes("book")) return "demo-booked";
  if (call.analysis?.interested || summary.includes("interested")) return "interested";
  if (summary.includes("call back") || summary.includes("callback")) return "callback";
  if (summary.includes("not interested") || summary.includes("remove")) return "not-interested";
  if (summary.includes("voicemail")) return "voicemail";
  if (!call.completed || call.call_length === 0) return "no-answer";
  return "completed";
}
