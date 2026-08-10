import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { resend_api_key, from_email, test_to } = await req.json();

  if (!resend_api_key || !test_to) {
    return NextResponse.json({ ok: false, error: "API key and recipient email are required" }, { status: 400 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resend_api_key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: from_email || "onboarding@resend.dev",
      to: test_to,
      subject: "Waresport Email Test ✓",
      html: `
        <p>Your Waresport email is configured correctly!</p>
        <p>Demo follow-up emails (confirmation + reminders at −24h, −1h, +24h, +48h) will be sent from <strong>${from_email || "onboarding@resend.dev"}</strong>.</p>
        <p>— The Waresport Team</p>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
