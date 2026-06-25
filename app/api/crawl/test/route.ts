import { NextRequest, NextResponse } from "next/server";
import { crawlMeetup } from "@/lib/crawlers/meetup";
import { crawlEventbrite } from "@/lib/crawlers/eventbrite";
import { crawlAsai } from "@/lib/crawlers/asai";
import { crawlAiAustria } from "@/lib/crawlers/aiaustria";
import { crawlAiAt } from "@/lib/crawlers/aiat";
import { crawlConfEurope } from "@/lib/crawlers/confeurope";
import { crawlAllConf } from "@/lib/crawlers/allconf";

import type { UnifiedEvent } from "@/lib/types";

const CRAWLERS: Record<string, () => Promise<UnifiedEvent[]>> = {
  meetup: crawlMeetup,
  eventbrite: crawlEventbrite,
  asai: crawlAsai,
  aiaustria: crawlAiAustria,
  aiat: crawlAiAt,
  confeurope: crawlConfEurope,
  allconf: crawlAllConf,
};

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source");

  if (!source || !CRAWLERS[source]) {
    return NextResponse.json(
      {
        error: `?source= must be one of: ${Object.keys(CRAWLERS).join(", ")}`,
        available: Object.keys(CRAWLERS),
      },
      { status: 400 }
    );
  }

  try {
    const start = Date.now();
    const result = await CRAWLERS[source]();
    const duration = Date.now() - start;

    return NextResponse.json({
      source,
      count: Array.isArray(result) ? result.length : 0,
      duration_ms: duration,
      events: result,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
