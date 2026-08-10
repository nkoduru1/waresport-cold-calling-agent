import { NextRequest, NextResponse } from "next/server";
import { getCallByBlandId, getContacts, getCampaign, setCallOutcome, saveContact } from "@/lib/store";
import { inferOutcome, BlandCall, schedulePhoneFollowUps } from "@/lib/bland";
import { sendDemoFollowUpEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body: BlandCall = await req.json();
    console.log("[Bland webhook]", JSON.stringify(body, null, 2));

    const blandCallId = body.call_id;
    if (!blandCallId) return NextResponse.json({ ok: true });

    const stored = getCallByBlandId(blandCallId);
    if (!stored) return NextResponse.json({ ok: true });

    const outcome = inferOutcome(body);
    setCallOutcome(stored.id, outcome);

    // Extract whatever the prospect shared during the call
    const preferredMethod = (body.analysis?.preferred_contact_method ?? "").toLowerCase().trim() as "phone" | "email" | "";
    const emailFromCall = body.analysis?.contact_email?.trim() || null;
    const phoneFromCall = body.analysis?.contact_phone?.trim() || null;

    const contacts = getContacts();
    const contact = contacts.find((c) => c.id === stored.contact_id) ?? null;

    // Determine the actual preferred contact value
    const preferredValue =
      preferredMethod === "email" ? emailFromCall :
      preferredMethod === "phone" ? (phoneFromCall || stored.phone) :
      null;

    // Persist the preference and any newly captured contact info to the contact record
    if (contact) {
      saveContact({
        ...contact,
        email: emailFromCall || contact.email || null,
        preferred_contact_method: preferredMethod === "email" || preferredMethod === "phone" ? preferredMethod : null,
        preferred_contact_value: preferredValue,
      });
    }

    if (outcome === "demo-booked") {
      const campaign = getCampaign(stored.campaign_id);

      if (preferredMethod === "phone") {
        await schedulePhoneFollowUps({
          phone: phoneFromCall || stored.phone,
          clubName: stored.club_name,
          voiceId: campaign?.voice_id,
          fromNumber: campaign?.from_number,
        });
        console.log(`[webhook] Scheduled 5 phone follow-up calls for ${stored.club_name}`);
      } else {
        const email = emailFromCall || contact?.email || null;
        if (email) {
          await sendDemoFollowUpEmail(email, stored.club_name);
        } else {
          console.warn(
            `[webhook] Demo booked — ${stored.club_name} prefers email but none found. ` +
            `No follow-up sent. Phone on file: ${stored.phone}`
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook]", e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
