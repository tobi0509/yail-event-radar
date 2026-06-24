import type { UnifiedEvent } from "@/lib/types";

// Austrian Society for AI — server-rendered site with schema.org microdata
// No API key needed, completely free
const ASAI_EVENTS_URL = "https://www.asai.ac.at/en/events";
const BASE_URL = "https://www.asai.ac.at/";

function parseDate(raw: string): string | null {
  // datetime attribute is already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

function extractEvents(html: string): UnifiedEvent[] {
  const results: UnifiedEvent[] = [];

  // Each event is wrapped in: <div class="event layout_teaser ..." itemscope itemtype="http://schema.org/Event">
  const blockRegex =
    /<div[^>]+itemscope[^>]+schema\.org\/Event[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;

  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const block = match[0];

    // Title + URL from <h2 itemprop="name"><a href="..." itemprop="url">TITLE</a>
    const titleMatch = block.match(
      /itemprop="name"[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/
    );
    if (!titleMatch) continue;

    const relativeUrl = titleMatch[1];
    const title = titleMatch[2].trim();
    const url = relativeUrl.startsWith("http")
      ? relativeUrl
      : BASE_URL + relativeUrl;

    // Date from <time datetime="YYYY-MM-DD"
    const dateMatch = block.match(/datetime="([^"]+)"/);
    const date = dateMatch ? parseDate(dateMatch[1]) : null;

    // Location from <span itemprop="name">CITY</span> inside .location div
    const locationMatch = block.match(
      /itemprop="location"[\s\S]*?itemprop="name">([^<]+)<\/span>/
    );
    const location = locationMatch
      ? `${locationMatch[1].trim()}, Österreich`
      : "Österreich";

    // Description from <div class="ce_text block" itemprop="description">
    const descMatch = block.match(
      /itemprop="description">([\s\S]*?)<\/div>/
    );
    const rawDescription = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 500)
      : undefined;

    results.push({
      title,
      date,
      location,
      url,
      source: "asai",
      rawDescription,
    });
  }

  return results;
}

export async function crawlAsai(): Promise<UnifiedEvent[]> {
  try {
    const res = await fetch(ASAI_EVENTS_URL, {
      headers: {
        "User-Agent": "YAIL-Event-Radar/1.0 (event aggregator)",
        Accept: "text/html",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.warn(`[asai] HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    const events = extractEvents(html);
    console.log(`[asai] ${events.length} events found`);
    return events;
  } catch (err) {
    console.warn("[asai] fetch failed:", err);
    return [];
  }
}
