import type { UnifiedEvent } from "@/lib/types";

// AI Factory Austria (AI:AT) — WordPress with Bricks Builder
// Events are server-rendered, no JS needed
const AIAT_EVENTS_URL = "https://ai-at.eu/en/events/";

const TARGET_CITIES = ["wien", "vienna", "linz", "graz", "salzburg", "online", "hybrid"];

function matchesTargetCity(text: string): boolean {
  const lower = text.toLowerCase();
  // If no city is mentioned at all, include it (might be online/TBA)
  const hasAnyCity = /wien|vienna|linz|graz|salzburg|innsbruck|klagenfurt|berlin|munich|münchen/i.test(lower);
  if (!hasAnyCity) return true;
  return TARGET_CITIES.some((city) => lower.includes(city));
}

function parseGermanDate(raw: string): string | null {
  // Format: "25. Juni 2026 @ 09:00" or "25. Juni 2026 – 27. Juni 2026"
  const months: Record<string, string> = {
    januar: "01", jänner: "01", february: "02", februar: "02",
    march: "03", märz: "03", april: "04", may: "05", mai: "05",
    june: "06", juni: "06", july: "07", juli: "07",
    august: "08", september: "09", october: "10", oktober: "10",
    november: "11", december: "12", dezember: "12",
  };

  const match = raw.match(/(\d{1,2})\.\s*(\w+)\s+(\d{4})/);
  if (!match) return null;

  const [, day, monthName, year] = match;
  const monthNum = months[monthName.toLowerCase()];
  if (!monthNum) return null;

  return `${year}-${monthNum}-${day.padStart(2, "0")}`;
}

function extractEvents(html: string): UnifiedEvent[] {
  const results: UnifiedEvent[] = [];
  const seenUrls = new Set<string>();

  // Each event card is an <a> wrapper containing title and date divs
  // The Bricks Builder uses randomized class names, but .brxe-post-title is stable
  // We look for link blocks that contain a post-title

  // Strategy: find each event block by looking for the post-title pattern
  // The structure is: <a href="..."><div>...<h2 class="brxe-... brxe-post-title">TITLE</h2>...</div></a>

  // Simpler approach: extract all blocks between event card boundaries
  const cardRegex = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<h2[^>]*brxe-post-title[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = cardRegex.exec(html)) !== null) {
    const url = match[1].trim();
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    const rest = match[3];

    if (!title || !url || seenUrls.has(url)) continue;
    seenUrls.add(url);

    // Extract date from text patterns in the rest of the card
    const dateText = rest.replace(/<[^>]+>/g, " ").trim();
    const date = parseGermanDate(dateText);

    // Extract location hints from the card text
    const locationMatch = dateText.match(
      /(?:in\s+person|online|hybrid|Wien|Vienna|Linz|Graz|Salzburg|Innsbruck|[A-Z][a-zäöü]+,\s*(?:Austria|Österreich))/i
    );
    const location = locationMatch
      ? locationMatch[0].trim()
      : null;

    // City filter
    const fullText = `${title} ${dateText} ${location ?? ""}`;
    if (!matchesTargetCity(fullText)) continue;

    results.push({
      title,
      date,
      location: location ? `${location}, Österreich` : "Österreich",
      url,
      source: "aiat",
      rawDescription: dateText.slice(0, 500) || undefined,
    });
  }

  // Fallback: also try the WordPress REST API for training events
  return results;
}

async function crawlIndicoTrainings(): Promise<UnifiedEvent[]> {
  try {
    const res = await fetch(
      "https://ai-at.eu/wp-json/wp/v2/indico_training?per_page=50&_fields=title,link,meta",
      {
        headers: { "User-Agent": "YAIL-Event-Radar/1.0" },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((item: Record<string, unknown>) => {
        const meta = item.meta as Record<string, string> | undefined;
        const loc = `${meta?.indico_location ?? ""} ${meta?.indico_room ?? ""}`;
        return matchesTargetCity(loc) || !loc.trim();
      })
      .map((item: Record<string, unknown>) => {
        const meta = item.meta as Record<string, string> | undefined;
        const title = (item.title as Record<string, string> | undefined);
        return {
          title: title?.rendered?.replace(/<[^>]+>/g, "").trim() ?? "Untitled",
          date: meta?.indico_start_date ?? null,
          location: meta?.indico_location
            ? `${meta.indico_location}, Österreich`
            : "Online",
          url: (item.link as string) ?? "",
          source: "aiat" as const,
          rawDescription: undefined,
        };
      })
      .filter((e: UnifiedEvent) => e.url);
  } catch {
    return [];
  }
}

export async function crawlAiAt(): Promise<UnifiedEvent[]> {
  try {
    const [htmlEvents, trainings] = await Promise.allSettled([
      (async () => {
        const res = await fetch(AIAT_EVENTS_URL, {
          headers: {
            "User-Agent": "YAIL-Event-Radar/1.0 (event aggregator)",
            Accept: "text/html",
          },
          next: { revalidate: 0 },
        });
        if (!res.ok) {
          console.warn(`[aiat] HTTP ${res.status}`);
          return [];
        }
        const html = await res.text();
        return extractEvents(html);
      })(),
      crawlIndicoTrainings(),
    ]);

    const results: UnifiedEvent[] = [];
    if (htmlEvents.status === "fulfilled") results.push(...htmlEvents.value);
    if (trainings.status === "fulfilled") results.push(...trainings.value);

    // Dedup by URL
    const seen = new Set<string>();
    const deduped = results.filter((e) => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    });

    console.log(`[aiat] ${deduped.length} events found`);
    return deduped;
  } catch (err) {
    console.warn("[aiat] crawl failed:", err);
    return [];
  }
}
