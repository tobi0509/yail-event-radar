import type { UnifiedEvent } from "@/lib/types";

// AI Austria — Notion-powered database with 300+ events
// Rendered as a static HTML table via Super.so, no JS needed
const DBEVENTS_URL = "https://aiaustria.com/dbevents";

// Regions that map to our target cities
const TARGET_REGIONS = ["vienna", "upper austria", "styria", "salzburg", "online"];

function matchesTargetRegion(region: string): boolean {
  const lower = region.toLowerCase();
  return TARGET_REGIONS.some((r) => lower.includes(r));
}

function parseNotionDate(raw: string): string | null {
  // Format: "05/24/2027" or "06/29/2026"
  const slashMatch = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

function regionToCity(region: string): string {
  const map: Record<string, string> = {
    vienna: "Wien",
    "upper austria": "Linz/OÖ",
    styria: "Graz/Steiermark",
    salzburg: "Salzburg",
    online: "Online",
    tyrol: "Innsbruck/Tirol",
    "lower austria": "Niederösterreich",
    carinthia: "Kärnten",
    burgenland: "Burgenland",
    vorarlberg: "Vorarlberg",
  };
  return map[region.toLowerCase()] ?? region;
}

function extractEvents(html: string): UnifiedEvent[] {
  const results: UnifiedEvent[] = [];
  const seenUrls = new Set<string>();

  // Split by <tr> — first two are header/empty, rest are data rows
  const rows = html.split("<tr>").slice(2);

  for (const row of rows) {
    // Title from notion-property__title
    const titleMatch = row.match(/notion-property__title[^>]*>([^<]+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();
    if (!title) continue;

    // URL from href in the title cell
    const urlMatch = row.match(/href="(https?:\/\/[^"]+)"/);
    if (!urlMatch) continue;
    const url = urlMatch[1].trim();
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    // Date from <span class="date">MM/DD/YYYY</span>
    const dateMatch = row.match(/<span class="date">([^<]+)<\/span>/);
    const date = dateMatch ? parseNotionDate(dateMatch[1].trim()) : null;

    // Extract all notion-pills — Notion uses pills for both format ("in person", "online")
    // and geographic region ("Vienna", "Upper Austria") — filter out format words
    const FORMAT_WORDS = new Set(["in person", "online", "hybrid", "virtual", "in-person"]);
    const pillRegex = /notion-pill[^"]*">([^<]+)<\/span>/g;
    const allPills: string[] = [];
    let pillMatch;
    while ((pillMatch = pillRegex.exec(row)) !== null) {
      allPills.push(pillMatch[1].trim());
    }
    const regionPills = allPills.filter((p) => !FORMAT_WORDS.has(p.toLowerCase()));
    const region = regionPills[0] ?? "";

    // Filter by target regions
    if (region && !matchesTargetRegion(region)) continue;

    // Description from property-62436f46
    const descMatch = row.match(/property-62436f46[^>]*>([^<]*)/);
    const rawDescription = descMatch
      ? descMatch[1].replace(/&amp;/g, "&").trim().slice(0, 500) || undefined
      : undefined;

    const location = region
      ? `${regionToCity(region)}, Österreich`
      : "Österreich";

    results.push({
      title,
      date,
      location,
      url,
      source: "aiaustria",
      rawDescription,
    });
  }

  return results;
}

export async function crawlAiAustria(): Promise<UnifiedEvent[]> {
  try {
    const res = await fetch(DBEVENTS_URL, {
      headers: {
        "User-Agent": "YAIL-Event-Radar/1.0 (event aggregator)",
        Accept: "text/html",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.warn(`[aiaustria] HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    const events = extractEvents(html);
    console.log(`[aiaustria] ${events.length} events found`);
    return events;
  } catch (err) {
    console.warn("[aiaustria] fetch failed:", err);
    return [];
  }
}
