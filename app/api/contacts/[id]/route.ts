import { NextRequest, NextResponse } from "next/server";
import { deleteContact } from "@/lib/store";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  deleteContact(params.id);
  return NextResponse.json({ ok: true });
}
