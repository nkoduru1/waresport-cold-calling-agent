import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

function read() {
  try { return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")); }
  catch { return { campaigns: [], contacts: [], calls: [], call_outcomes: {} }; }
}

function write(data: unknown) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

// PATCH /api/calls/[id] — override outcome (e.g. mark demo-booked)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { outcome } = await req.json();
  const store = read();
  if (!store.call_outcomes) store.call_outcomes = {};
  store.call_outcomes[params.id] = outcome;
  write(store);
  return NextResponse.json({ ok: true });
}

// GET /api/calls/[id]/outcome — get manual override if any
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const store = read();
  const outcome = store.call_outcomes?.[params.id] ?? null;
  return NextResponse.json({ outcome });
}
