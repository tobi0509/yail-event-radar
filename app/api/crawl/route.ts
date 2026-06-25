import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { crawlMeetup } from "@/lib/crawlers/meetup";
import { crawlAsai } from "@/lib/crawlers/asai";
import { crawlAiAustria } from "@/lib/crawlers/aiaustria";
import { crawlAiAt } from "@/lib/crawlers/aiat";
import { crawlConfEurope } from "@/lib/crawlers/confeurope";
import { crawlAllConf } from "@/lib/crawlers/allconf";
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
    const crawlerEntries = [
      { name: "meetup", fn: crawlMeetup },
      { name: "asai", fn: crawlAsai },
      { name: "aiaustria", fn: crawlAiAustria },
      { name: "aiat", fn: crawlAiAt },
      { name: "confeurope", fn: crawlConfEurope },
      { name: "allconf", fn: crawlAllConf },
    ] as const;

    const results = await Promise.allSettled(
      crawlerEntries.map((c) => c.fn())
    );

    const allRaw: UnifiedEvent[] = [];

    results.forEach((result, i) => {
      const name = crawlerEntries[i].name;
      if (result.status === "fulfilled") {
        allRaw.push(...result.value);
      } else {
        errors.push(`${name}: ${String(result.reason)}`);
      }
    });

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

    // Mark existing upcoming events as past if their date has passed
    const today = new Date().toISOString().slice(0, 10);
    await db
      .update(events)
      .set({ status: "past" })
      .where(
        and(
          eq(events.status, "upcoming"),
          sql`${events.date} < ${today}`
        )
      );

    // Insert all novel events — no AI filter, community rates them
    for (const event of novel) {
      try {
        const isPast = event.date && event.date < today;
        await db
          .insert(events)
          .values({
            title: event.title,
            date: event.date,
            location: event.location,
            category: detectCategory(event.title, event.rawDescription),
            url: event.url,
            source: event.source,
            status: isPast ? "past" : "upcoming",
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
