import type { UnifiedEvent } from "@/lib/types";

interface GoogleSearchItem {
  title?: string;
  link?: string;
  snippet?: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
}

const QUERIES = [
  "AI Event Österreich 2025 2026",
  "Künstliche Intelligenz Konferenz Wien Linz Graz 2025",
  "Machine Learning Meetup Austria 2025 2026",
];

export async function crawlGoogle(): Promise<UnifiedEvent[]> {
  const key = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;

  if (!key || !cx) {
    console.warn("[google] GOOGLE_CSE_API_KEY or GOOGLE_CSE_ID not set, skipping");
    return [];
  }

  const allResults: UnifiedEvent[] = [];
  const seenUrls = new Set<string>();

  for (const q of QUERIES) {
    const params = new URLSearchParams({
      key,
      cx,
      q,
      num: "10",
      dateRestrict: "y1",
    });

    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { next: { revalidate: 0 } }
    );

    if (!res.ok) {
      console.error(`[google] HTTP ${res.status} for query "${q}": ${await res.text()}`);
      continue;
    }

    const data: GoogleSearchResponse = await res.json();
    const items = data.items ?? [];

    for (const item of items) {
      const url = item.link;
      if (!url || !item.title || seenUrls.has(url)) continue;
      seenUrls.add(url);

      allResults.push({
        title: item.title,
        date: null, // Gemini will extract from snippet
        location: null,
        url,
        source: "google",
        rawDescription: item.snippet?.slice(0, 500),
      });
    }
  }

  return allResults;
}
