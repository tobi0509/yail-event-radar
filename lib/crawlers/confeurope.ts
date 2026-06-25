import type { UnifiedEvent } from "@/lib/types";

// Conference in Europe — server-rendered HTML table
// Lists AI conferences in Austria with dates, cities, and event URLs
const BASE_URL = "https://www.conferenceineurope.org/austria/artificial-intelligence";

const TARGET_CITIES = ["vienna", "wien", "linz", "graz", "salzburg"];

function matchesTargetCity(location: string): boolean {
  const lower = location.toLowerCase();
  // If no specific city is mentioned, include it
  if (!lower || lower === "austria") return true;
  return TARGET_CITIES.some((city) => lower.includes(city));
}

function parseDate(raw: string): string | null {
  // Format: "26 Jun 2026" or "09 Jul 2026"
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

function extractEvents(html: string): UnifiedEvent[] {
  const results: UnifiedEvent[] = [];
  const seenUrls = new Set<string>();

  // Each event is a <tr> containing:
  //   <td> with date (fa-calendar-check + "26 Jun 2026")
  //   <td> with event name (<a> with title) and location (fa-location-dot + <span>city</span>)
  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[0];

    // Skip rows without event links
    if (!row.includes("conferenceineurope.org/event/")) continue;

    // Extract event URL
    const urlMatch = row.match(/href="(https:\/\/www\.conferenceineurope\.org\/event\/\d+)"/);
    if (!urlMatch) continue;
    const url = urlMatch[1];
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    // Extract date: text after fa-calendar-check icon
    const dateMatch = row.match(/fa-calendar-check[\s\S]*?>\s*([\d]+\s+\w+\s+\d{4})\s*</);
    const date = dateMatch ? parseDate(dateMatch[1]) : null;

    // Extract title: the bold event name link
    const titleMatch = row.match(
      /class="[^"]*text-2xl font-bold[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/a>/
    );
    if (!titleMatch) continue;
    const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
    if (!title) continue;

    // Extract location: text inside <span> after fa-location-dot
    const locationMatch = row.match(
      /fa-location-dot[\s\S]*?<span[^>]*>\s*([\s\S]*?)\s*<\/span>/
    );
    const location = locationMatch
      ? locationMatch[1].replace(/<[^>]+>/g, "").trim()
      : "Austria";

    // Filter by target cities
    if (!matchesTargetCity(location)) continue;

    results.push({
      title,
      date,
      location,
      url,
      source: "confeurope",
      rawDescription: undefined,
    });
  }

  return results;
}

export async function crawlConfEurope(): Promise<UnifiedEvent[]> {
  try {
    const res = await fetch(BASE_URL, {
      headers: {
        "User-Agent": "YAIL-Event-Radar/1.0 (event aggregator)",
        Accept: "text/html",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.warn(`[confeurope] HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    const events = extractEvents(html);
    console.log(`[confeurope] ${events.length} events found`);
    return events;
  } catch (err) {
    console.warn("[confeurope] fetch failed:", err);
    return [];
  }
}
