import { NextRequest, NextResponse } from "next/server";
import { getCampaign, updateCampaignStatus } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = getCampaign(params.id);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  updateCampaignStatus(params.id, status);
  return NextResponse.json({ ok: true });
}
