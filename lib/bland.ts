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
  analysis_schema?: Record<string, { type: string; description: string }>;
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
    contact_email?: string;
    preferred_contact_method?: string;
    contact_phone?: string;
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
      voice: opts.voice ?? "2f9fdbc7-4bf2-4792-8a18-21ce3c93978f",
      record: opts.record ?? true,
      wait_for_greeting: opts.wait_for_greeting ?? true,
      max_duration: opts.max_duration ?? 10,
      voicemail_action: "leave_message",
      voicemail_message: opts.voicemail_message ?? "Hi, this is an AI assistant calling from Waresport. We help sports clubs save 15 to 20 hours per week on admin work by managing registrations, scheduling, and payments all in one platform. I would love to show you a quick 15 minute demo. Please visit waresport.com or call us back. Thank you and have a great day!",
      webhook: opts.webhook,
      ...(opts.from ? { from: opts.from } : {}),
      metadata: opts.metadata ?? {},
      analysis_schema: opts.analysis_schema ?? {
        demo_booked: { type: "boolean", description: "Did the contact agree to schedule or book a demo?" },
        preferred_contact_method: { type: "string", description: "How does the contact prefer to be reached for follow-up? Return 'email' or 'phone'. Return empty string if not stated." },
        contact_email: { type: "string", description: "Email address provided by the contact during the call for follow-up. Return empty string if none given." },
        contact_phone: { type: "string", description: "Alternative phone number provided by the contact for follow-up, if different from the number dialed. Return empty string if none given." },
      },
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

function nextBusinessDay(days: number): Date {
  const d = new Date();
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  d.setUTCHours(15, 0, 0, 0); // 10 AM ET
  return d;
}

async function scheduleCall(opts: {
  phone: string;
  task: string;
  voice?: string;
  from?: string;
  startTime: Date;
}): Promise<void> {
  await fetch(`${BLAND_BASE}/calls`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      phone_number: opts.phone,
      task: opts.task,
      voice: opts.voice ?? "2f9fdbc7-4bf2-4792-8a18-21ce3c93978f",
      record: true,
      max_duration: 2,
      start_time: opts.startTime.toISOString(),
      ...(opts.from ? { from: opts.from } : {}),
    }),
  });
}

export async function schedulePhoneFollowUps(params: {
  phone: string;
  clubName: string;
  voiceId?: string;
  fromNumber?: string;
}): Promise<void> {
  const { phone, clubName, voiceId, fromNumber } = params;
  const now = Date.now();
  const demoDate = nextBusinessDay(3);

  const dateStr = demoDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
    timeZone: "America/New_York",
  });

  const base = { phone, voice: voiceId, from: fromNumber };
  const calls: Promise<void>[] = [];

  // 1. Immediate confirmation call (~1 min from now)
  calls.push(scheduleCall({
    ...base,
    startTime: new Date(now + 60 * 1000),
    task: `You are calling on behalf of Waresport to confirm a demo appointment. Say: "Hi, this is a quick call from Waresport to confirm your demo on ${dateStr} at 10 AM Eastern Time. We're looking forward to showing you how to save 15 to 20 hours a week on club admin. If you need to reschedule, please call us back or let us know. Talk soon!"`,
  }));

  // 2. −24h reminder
  const minus24 = new Date(demoDate.getTime() - 24 * 60 * 60 * 1000);
  if (minus24.getTime() > now + 5 * 60 * 1000) {
    calls.push(scheduleCall({
      ...base,
      startTime: minus24,
      task: `You are calling on behalf of Waresport to give a demo reminder. Say: "Hi, this is a reminder from Waresport that your demo is scheduled for tomorrow, ${dateStr}, at 10 AM Eastern Time. We look forward to connecting with you! If you need to reschedule, please call us back. See you tomorrow!"`,
    }));
  }

  // 3. −1h reminder
  const minus1 = new Date(demoDate.getTime() - 60 * 60 * 1000);
  if (minus1.getTime() > now + 5 * 60 * 1000) {
    calls.push(scheduleCall({
      ...base,
      startTime: minus1,
      task: `You are calling on behalf of Waresport. Say: "Hi, your Waresport demo starts in one hour at 10 AM Eastern Time. Our team will be reaching out to you very shortly. Talk soon!"`,
    }));
  }

  // 4. +24h post-demo follow-up
  const plus24 = new Date(demoDate.getTime() + 24 * 60 * 60 * 1000);
  calls.push(scheduleCall({
    ...base,
    startTime: plus24,
    task: `You are calling on behalf of Waresport to follow up after a demo. Say: "Hi ${clubName}, this is Waresport following up after your demo yesterday. We hope it was helpful! Do you have any questions, or are you ready to get started with a free trial? Please call us back or visit waresport.com. We'd love to help your club save time on admin work. Have a great day!"`,
  }));

  // 5. +48h second follow-up
  const plus48 = new Date(demoDate.getTime() + 48 * 60 * 60 * 1000);
  calls.push(scheduleCall({
    ...base,
    startTime: plus48,
    task: `You are calling on behalf of Waresport for a final follow-up. Say: "Hi ${clubName}, this is one more follow-up from Waresport. We wanted to make sure all your questions were answered after your recent demo. Many clubs find the biggest wins come from automating registration renewals and payment reminders — saving 5 to 10 hours a week on those alone. If you're ready to move forward or just have questions, please give us a call back. We'd love to get you started. Thank you and have a great day!"`,
  }));

  await Promise.allSettled(calls);
}

export function formatTranscript(transcripts: BlandCall["transcripts"]): string {
  if (!transcripts || transcripts.length === 0) return "";
  return transcripts
    .map((t) => `${t.user === "assistant" ? "Agent" : "Contact"}: ${t.text}`)
    .join("\n\n");
}

const DEMO_VERBS = ["book", "schedule", "set up", "arrange", "sign up", "agreed to", "wants a", "interested in a"];

export function inferOutcome(call: BlandCall): string {
  const summary = (call.summary ?? "").toLowerCase();
  const demoBooked =
    call.analysis?.demo_booked === true ||
    (summary.includes("demo") && DEMO_VERBS.some((kw) => summary.includes(kw)));
  if (demoBooked) return "demo-booked";
  if (call.analysis?.interested || summary.includes("interested")) return "interested";
  if (summary.includes("call back") || summary.includes("callback")) return "callback";
  if (summary.includes("not interested") || summary.includes("remove")) return "not-interested";
  if (summary.includes("voicemail")) return "voicemail";
  if (!call.completed || call.call_length === 0) return "no-answer";
  return "completed";
}
