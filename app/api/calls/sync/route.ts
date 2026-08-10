import { NextResponse } from "next/server";
import { getCalls, getCallByBlandId, getContacts, getCampaign, setCallOutcome, saveContact } from "@/lib/store";
import { getCall, inferOutcome, schedulePhoneFollowUps } from "@/lib/bland";
import { sendDemoFollowUpEmail } from "@/lib/email";

export async function POST() {
  const calls = getCalls();
  const contacts = getContacts();

  let synced = 0;
  let emailed = 0;
  const errors: string[] = [];

  for (const stored of calls) {
    if (!stored.bland_call_id) continue;

    try {
      const blandCall = await getCall(stored.bland_call_id);
      if (!blandCall.completed) continue;

      const outcome = inferOutcome(blandCall);
      setCallOutcome(stored.id, outcome);
      synced++;

      if (outcome !== "demo-booked") continue;

      const preferredMethod = (blandCall.analysis?.preferred_contact_method ?? "").toLowerCase().trim();
      const emailFromCall = blandCall.analysis?.contact_email?.trim() || null;
      const phoneFromCall = blandCall.analysis?.contact_phone?.trim() || null;
      const contact = contacts.find((c) => c.id === stored.contact_id) ?? null;

      const preferredValue =
        preferredMethod === "email" ? emailFromCall :
        preferredMethod === "phone" ? (phoneFromCall || stored.phone) : null;

      if (contact) {
        saveContact({
          ...contact,
          email: emailFromCall || contact.email || null,
          preferred_contact_method: preferredMethod === "email" || preferredMethod === "phone" ? preferredMethod : null,
          preferred_contact_value: preferredValue,
        });
      }

      if (preferredMethod === "phone") {
        const campaign = getCampaign(stored.campaign_id);
        await schedulePhoneFollowUps({
          phone: phoneFromCall || stored.phone,
          clubName: stored.club_name,
          voiceId: campaign?.voice_id,
          fromNumber: campaign?.from_number,
        });
        emailed++;
      } else {
        const email = emailFromCall || contact?.email || null;
        if (email) {
          await sendDemoFollowUpEmail(email, stored.club_name);
          emailed++;
        }
      }
    } catch (e) {
      errors.push(`${stored.bland_call_id}: ${e}`);
    }
  }

  return NextResponse.json({ synced, emailed, errors });
}
