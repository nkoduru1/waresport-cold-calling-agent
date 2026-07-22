import { NextRequest, NextResponse } from "next/server";

// Bland.ai POSTs here when a call ends with status + transcript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Bland webhook]", JSON.stringify(body, null, 2));
    // The call data is already fetched live from Bland.ai in /api/calls
    // so we don't need to store anything here — just acknowledge.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
