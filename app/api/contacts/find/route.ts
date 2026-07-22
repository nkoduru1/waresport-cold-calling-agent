import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const SERP_KEY = process.env.SERP_API_KEY!;

function formatPhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^1/, "");
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") ?? "";
  const city = req.nextUrl.searchParams.get("city") ?? "";

  if (!query || !city) {
    return NextResponse.json({ error: "query and city are required" }, { status: 400 });
  }

  const searchQuery = `${query} in ${city}`;
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("type", "search");
  url.searchParams.set("api_key", SERP_KEY);

  try {
    const res = await fetch(url.toString());

    if (!res.ok) {
      const text = await res.text();
      console.error("SerpAPI error:", res.status, text.slice(0, 300));
      return NextResponse.json({ error: "Search failed, try again" }, { status: 502 });
    }

    const data = await res.json();
    const places = data.local_results ?? [];

    const results = places
      .filter((p: any) => p.phone)
      .map((p: any) => ({
        id: randomUUID(),
        club_name: p.title ?? p.name,
        phone: formatPhone(p.phone),
        email: null,
        website: p.website ?? null,
        address: p.address ?? null,
        city,
        state: "",
        source: "google_places",
        verified: true,
        created_at: new Date().toISOString(),
        notes: p.type ?? "",
        rating: p.rating ?? null,
        reviews: p.reviews ?? null,
      }));

    return NextResponse.json({
      results,
      total: places.length,
      with_phone: results.length,
    });
  } catch (err) {
    console.error("SerpAPI fetch failed:", err);
    return NextResponse.json({ error: "Search service unavailable" }, { status: 503 });
  }
}
