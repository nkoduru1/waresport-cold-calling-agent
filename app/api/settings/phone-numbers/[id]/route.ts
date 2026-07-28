import { NextRequest, NextResponse } from "next/server";
import { deletePhoneNumber } from "@/lib/store";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  deletePhoneNumber(params.id);
  return NextResponse.json({ ok: true });
}
