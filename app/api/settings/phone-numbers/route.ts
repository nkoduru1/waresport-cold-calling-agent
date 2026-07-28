import { NextRequest, NextResponse } from "next/server";
import { getPhoneNumbers, savePhoneNumber } from "@/lib/store";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json(getPhoneNumbers());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pn = {
    id: randomUUID(),
    label: body.label ?? "",
    number: body.number ?? "",
    created_at: new Date().toISOString(),
  };
  savePhoneNumber(pn);
  return NextResponse.json(pn, { status: 201 });
}
