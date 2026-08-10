import { NextRequest, NextResponse } from "next/server";
import { getCampaign, updateCampaignStatus, updateCampaignContacts, deleteCampaign } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = getCampaign(params.id);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  deleteCampaign(params.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (body.status) {
    updateCampaignStatus(params.id, body.status);
  }
  if (body.contacts) {
    updateCampaignContacts(params.id, body.contacts);
  }
  return NextResponse.json({ ok: true });
}
