import { NextRequest, NextResponse } from "next/server";
import { getCampaign, updateCampaignStatus, saveCall } from "@/lib/store";
import { makeCall } from "@/lib/bland";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = getCampaign(params.id);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  const webhookUrl = `${origin}/api/webhooks/bland`;

  const results: Array<{ contact: string; call_id?: string; error?: string }> = [];

  for (const contact of campaign.contacts) {
    const phone = contact.phone.replace(/\D/g, "");
    const e164 = phone.startsWith("1") ? `+${phone}` : `+1${phone}`;

    try {
      const { call_id } = await makeCall({
        phone_number: e164,
        task: campaign.script,
        voice: campaign.voice_id,
        record: true,
        wait_for_greeting: true,
        webhook: webhookUrl,
        metadata: {
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          contact_id: contact.id,
          club_name: contact.club_name,
        },
      });

      saveCall({
        id: randomUUID(),
        bland_call_id: call_id,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        contact_id: contact.id,
        club_name: contact.club_name,
        phone: contact.phone,
        created_at: new Date().toISOString(),
      });

      results.push({ contact: contact.club_name, call_id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ contact: contact.club_name, error: message });
    }
  }

  updateCampaignStatus(params.id, "active");

  return NextResponse.json({ launched: results.filter((r) => r.call_id).length, results });
}
