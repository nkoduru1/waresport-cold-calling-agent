import { NextRequest, NextResponse } from "next/server";
import { getCallById, getContacts, setCallOutcome } from "@/lib/store";
import { sendDemoFollowUpEmail } from "@/lib/email";

// PATCH /api/calls/[id] — override outcome (e.g. mark demo-booked)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { outcome, contact_email } = await req.json();
  setCallOutcome(params.id, outcome);

  if (outcome === "demo-booked") {
    const call = getCallById(params.id);
    if (call) {
      const contacts = getContacts();
      const contact = contacts.find((c) => c.id === call.contact_id);
      const preferred = contact?.preferred_contact_method;
      const email = contact_email ?? contact?.email ?? null;

      if (preferred === "phone") {
        // Respect their stated preference — don't send email
        console.log(`[calls] Demo marked — ${call.club_name} prefers phone follow-up at ${contact?.preferred_contact_value || call.phone}`);
      } else if (email) {
        await sendDemoFollowUpEmail(email, call.club_name);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// GET /api/calls/[id]/outcome — get manual override if any
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { getCallOutcomes } = await import("@/lib/store");
  const outcomes = getCallOutcomes();
  const outcome = outcomes[params.id] ?? null;
  return NextResponse.json({ outcome });
}
