import type { UnifiedEvent } from "@/lib/types";

// Brave Search API — https://brave.com/search/api
// Free Tier: 2.000 Abfragen/Monat (reicht für wöchentliche Crawls)
// API Key: https://api.search.brave.com/app/keys

const QUERIES = [
  "AI Event Wien Österreich 2025 2026",
  "Machine Learning Meetup Austria Konferenz",
  "KI Hackathon Workshop Österreich site:meetup.com OR site:eventbrite.com OR site:lu.ma",
  "AI Conference Vienna Linz Graz 2026",
];

interface BraveResult {
  title?: string;
  url?: string;
  description?: string;
}

interface BraveResponse {
  web?: { results?: BraveResult[] };
}

export async function crawlBraveSearch(): Promise<UnifiedEvent[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) {
    console.warn("[brave] BRAVE_SEARCH_API_KEY not set, skipping");
    return [];
  }

  const results: UnifiedEvent[] = [];
  const seenUrls = new Set<string>();

  for (const q of QUERIES) {
    try {
      const params = new URLSearchParams({
        q,
        count: "10",
        country: "AT",
        search_lang: "de",
        freshness: "py", // past year
      });

      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?${params}`,
        {
          headers: {
            "Accept": "application/json",
            "X-Subscription-Token": key,
          },
          next: { revalidate: 0 },
        }
      );

      if (!res.ok) {
        console.error(`[brave] HTTP ${res.status} for query "${q}"`);
        continue;
      }

      const data: BraveResponse = await res.json();
      const items = data.web?.results ?? [];

      for (const item of items) {
        const url = item.url;
        if (!url || !item.title || seenUrls.has(url)) continue;
        seenUrls.add(url);

        results.push({
          title: item.title,
          date: null,
          location: null,
          url,
          source: "google", // behält "google" als source-label für UI
          rawDescription: item.description?.slice(0, 500),
        });
      }
    } catch (err) {
      console.error(`[brave] error for query "${q}":`, err);
    }
  }

  console.log(`[brave] ${results.length} results from ${QUERIES.length} queries`);
  return results;
}
