import { NextRequest, NextResponse } from "next/server";
import { getEmailSettings, saveEmailSettings } from "@/lib/store";

export async function GET() {
  const settings = getEmailSettings();
  return NextResponse.json(settings ?? { resend_api_key: "", from_email: "" });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  saveEmailSettings({
    resend_api_key: body.resend_api_key ?? "",
    from_email: body.from_email ?? "",
  });
  return NextResponse.json({ ok: true });
}
