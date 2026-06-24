import type { UnifiedEvent } from "@/lib/types";

interface EventbriteVenueAddress {
  city?: string;
  country?: string;
}

interface EventbriteVenue {
  address?: EventbriteVenueAddress;
}

interface EventbriteEvent {
  name?: { text?: string };
  start?: { local?: string };
  url?: string;
  description?: { text?: string };
  venue?: EventbriteVenue;
}

interface EventbritePage {
  events?: EventbriteEvent[];
  pagination?: { page_count?: number; page_number?: number };
}

export async function crawlEventbrite(): Promise<UnifiedEvent[]> {
  const token = process.env.EVENTBRITE_API_KEY;
  if (!token) {
    console.warn("[eventbrite] EVENTBRITE_API_KEY not set, skipping");
    return [];
  }

  const results: UnifiedEvent[] = [];
  const maxPages = 3;

  for (let page = 1; page <= maxPages; page++) {
    const params = new URLSearchParams({
      q: "artificial intelligence machine learning KI",
      "location.address": "Austria",
      "location.within": "500km",
      categories: "102", // Science & Technology
      expand: "venue",
      page_size: "50",
      page: String(page),
    });

    const res = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      console.error(`[eventbrite] HTTP ${res.status} on page ${page}: ${await res.text()}`);
      break;
    }

    const data: EventbritePage = await res.json();
    const raw = data.events ?? [];

    for (const e of raw) {
      const title = e.name?.text;
      const url = e.url;
      if (!title || !url) continue;

      results.push({
        title,
        date: e.start?.local?.slice(0, 10) ?? null,
        location: e.venue?.address?.city
          ? `${e.venue.address.city}, ${e.venue.address.country ?? "AT"}`
          : null,
        url,
        source: "eventbrite",
        rawDescription: e.description?.text?.slice(0, 500),
      });
    }

    const totalPages = data.pagination?.page_count ?? 1;
    if (page >= totalPages) break;
  }

  return results;
}
