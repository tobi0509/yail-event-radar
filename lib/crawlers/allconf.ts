import type { UnifiedEvent } from "@/lib/types";

// Conference in Europe — city-specific pages for broader coverage
// Supplements the main /austria/artificial-intelligence crawler
// by also catching tech/data-science conferences in target cities
const CITY_PAGES = [
  { url: "https://www.conferenceineurope.org/vienna/artificial-intelligence", city: "Vienna, Austria" },
  { url: "https://www.conferenceineurope.org/linz/artificial-intelligence", city: "Linz, Austria" },
  { url: "https://www.conferenceineurope.org/graz/artificial-intelligence", city: "Graz, Austria" },
  { url: "https://www.conferenceineurope.org/salzburg/artificial-intelligence", city: "Salzburg, Austria" },
];

function parseDate(raw: string): string | null {
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  const match = raw.trim().match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (!match) return null;

  const [, day, month, year] = match;
  const monthNum = months[month.toLowerCase()];
  if (!monthNum) return null;

  return `${year}-${monthNum}-${day.padStart(2, "0")}`;
}

function extractEvents(html: string, defaultCity: string): UnifiedEvent[] {
  const results: UnifiedEvent[] = [];

  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[0];
    if (!row.includes("conferenceineurope.org/event/")) continue;

    const urlMatch = row.match(/href="(https:\/\/www\.conferenceineurope\.org\/event\/\d+)"/);
    if (!urlMatch) continue;

    const dateMatch = row.match(/fa-calendar-check[\s\S]*?>\s*([\d]+\s+\w+\s+\d{4})\s*</);
    const date = dateMatch ? parseDate(dateMatch[1]) : null;

    const titleMatch = row.match(
      /class="[^"]*text-2xl font-bold[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/a>/
    );
    if (!titleMatch) continue;
    const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
    if (!title) continue;

    const locationMatch = row.match(
      /fa-location-dot[\s\S]*?<span[^>]*>\s*([\s\S]*?)\s*<\/span>/
    );
    const location = locationMatch
      ? locationMatch[1].replace(/<[^>]+>/g, "").trim()
      : defaultCity;

    results.push({
      title,
      date,
      location,
      url: urlMatch[1],
      source: "allconf",
      rawDescription: undefined,
    });
  }

  return results;
}

export async function crawlAllConf(): Promise<UnifiedEvent[]> {
  const results: UnifiedEvent[] = [];
  const seenUrls = new Set<string>();

  for (const { url, city } of CITY_PAGES) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "YAIL-Event-Radar/1.0 (event aggregator)",
          Accept: "text/html",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) continue;

      const html = await res.text();
      const events = extractEvents(html, city);

      for (const event of events) {
        if (!seenUrls.has(event.url)) {
          seenUrls.add(event.url);
          results.push(event);
        }
      }
    } catch (err) {
      console.warn(`[allconf] fetch failed for ${city}:`, err);
    }
  }

  console.log(`[allconf] ${results.length} events from ${CITY_PAGES.length} cities`);
  return results;
}
