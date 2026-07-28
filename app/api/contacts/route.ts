import { NextRequest, NextResponse } from "next/server";
import { getContacts, saveContact } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getContacts());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contacts = Array.isArray(body) ? body : [body];
  contacts.forEach((c) => saveContact(c));
  return NextResponse.json({ ok: true, count: contacts.length });
}
