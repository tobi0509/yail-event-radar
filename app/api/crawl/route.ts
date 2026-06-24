import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { crawlMeetup } from "@/lib/crawlers/meetup";
import { crawlEventbrite } from "@/lib/crawlers/eventbrite";
import { crawlBraveSearch } from "@/lib/crawlers/brave-search";
import { detectCategory } from "@/lib/categorize";
import type { UnifiedEvent } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  const secret = process.env.CRAWL_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  let inserted = 0;
  let skipped = 0;

  try {
    // Run all crawlers in parallel
    const [meetupResult, eventbriteResult, braveResult] =
      await Promise.allSettled([
        crawlMeetup(),
        crawlEventbrite(),
        crawlBraveSearch(),
      ]);

    const allRaw: UnifiedEvent[] = [];

    if (meetupResult.status === "fulfilled") {
      allRaw.push(...meetupResult.value);
    } else {
      errors.push(`meetup: ${String(meetupResult.reason)}`);
    }
    if (eventbriteResult.status === "fulfilled") {
      allRaw.push(...eventbriteResult.value);
    } else {
      errors.push(`eventbrite: ${String(eventbriteResult.reason)}`);
    }
    if (braveResult.status === "fulfilled") {
      allRaw.push(...braveResult.value);
    } else {
      errors.push(`brave: ${String(braveResult.reason)}`);
    }

    // In-memory dedup by URL
    const seenUrls = new Set<string>();
    const deduped = allRaw.filter((e) => {
      if (!e.url || seenUrls.has(e.url)) return false;
      seenUrls.add(e.url);
      return true;
    });

    // Filter against existing DB entries
    const existing = await db.select({ url: events.url }).from(events);
    const existingUrls = new Set(
      existing.map((e) => e.url).filter(Boolean) as string[]
    );
    const novel = deduped.filter((e) => !existingUrls.has(e.url));

    console.log(
      `[crawl] raw=${allRaw.length} deduped=${deduped.length} novel=${novel.length}`
    );

    // Insert all novel events — no AI filter, community rates them
    for (const event of novel) {
      try {
        await db
          .insert(events)
          .values({
            title: event.title,
            date: event.date,
            location: event.location,
            category: detectCategory(event.title, event.rawDescription),
            url: event.url,
            source: event.source,
            status: "upcoming",
          })
          .onConflictDoNothing();
        inserted++;
      } catch (dbErr) {
        console.error("[crawl] DB insert failed:", dbErr);
        errors.push(`insert failed for: ${event.url}`);
        skipped++;
      }
    }

    return NextResponse.json({ inserted, skipped, errors });
  } catch (err) {
    console.error("[POST /api/crawl]", err);
    return NextResponse.json(
      { error: "Crawl failed", details: String(err) },
      { status: 500 }
    );
  }
}
