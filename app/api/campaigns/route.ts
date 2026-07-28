import { NextRequest, NextResponse } from "next/server";
import { getCampaigns, saveCampaign } from "@/lib/store";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json(getCampaigns());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const campaign = {
    id: randomUUID(),
    name: body.name,
    description: body.description ?? "",
    script: body.script,
    voice_id: body.voice_id ?? "maya",
    max_calls_per_day: body.max_calls_per_day ?? 30,
    call_time_start: body.call_time_start ?? "09:00",
    call_time_end: body.call_time_end ?? "17:00",
    timezone: body.timezone ?? "America/Chicago",
    status: "draft",
    contacts: body.contacts ?? [],
    from_number: body.from_number ?? "",
    created_at: new Date().toISOString(),
  };
  saveCampaign(campaign);
  return NextResponse.json(campaign, { status: 201 });
}
