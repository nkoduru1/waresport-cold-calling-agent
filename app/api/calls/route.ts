import { NextRequest, NextResponse } from "next/server";
import { getCalls, getCallOutcomes } from "@/lib/store";
import { getCall, formatTranscript, inferOutcome } from "@/lib/bland";

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get("campaign_id") ?? undefined;
  const stored = getCalls(campaignId);

  if (stored.length === 0) return NextResponse.json([]);

  const overrides = getCallOutcomes();

  const enriched = await Promise.all(
    stored.map(async (s) => {
      try {
        const live = await getCall(s.bland_call_id);
        const outcome = overrides[s.id] ?? inferOutcome(live);
        return {
          id: s.id,
          bland_call_id: s.bland_call_id,
          campaign_id: s.campaign_id,
          campaign_name: s.campaign_name,
          contact_id: s.contact_id,
          club_name: s.club_name,
          phone: s.phone,
          status: live.completed ? "completed" : "in-progress",
          outcome,
          duration: Math.round((live.call_length ?? 0) * 60),
          recording_url: live.recording_url ?? null,
          transcript: formatTranscript(live.transcripts),
          summary: live.summary ?? null,
          started_at: s.created_at,
          ended_at: live.ended_at ?? null,
        };
      } catch {
        return {
          id: s.id,
          bland_call_id: s.bland_call_id,
          campaign_id: s.campaign_id,
          campaign_name: s.campaign_name,
          contact_id: s.contact_id,
          club_name: s.club_name,
          phone: s.phone,
          status: "initiated",
          outcome: "pending",
          duration: 0,
          recording_url: null,
          transcript: null,
          summary: null,
          started_at: s.created_at,
          ended_at: null,
        };
      }
    })
  );

  return NextResponse.json(enriched);
}
