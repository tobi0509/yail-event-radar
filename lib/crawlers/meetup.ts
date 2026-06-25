import type { UnifiedEvent } from "@/lib/types";

// Österreichische AI/Tech-Meetup-Gruppen auf Meetup.com
// RSS-Feeds sind öffentlich — kein API-Key nötig
const MEETUP_GROUPS = [
  "ai-austria",
  "vienna-ai-tinkerers",
  "viennaml",
  "data-science-austria",
  "tensorflow-and-deep-learning-vienna",
  "PyData-Vienna",
  "linz-data-science",
  "vienna-deep-learning",
  "GDG-Vienna",
  "AWS-Vienna",
  "vienna-data-science-group",
  "Graz-AI-Meetup",
  "tech-talks-vienna",
];

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
      return (m?.[1] ?? m?.[2] ?? "").trim();
    };

    const title = get("title");
    const link = get("link") || get("guid");
    if (title && link) {
      items.push({ title, link, pubDate: get("pubDate"), description: get("description") });
    }
  }
  return items;
}

function extractDate(pubDate: string): string | null {
  if (!pubDate) return null;
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function extractLocation(description: string): string | null {
  // Meetup RSS descriptions often contain "Location: ..." or city names
  const m = description.match(/(?:Location|Ort|Venue|Adresse):\s*([^<\n,]+)/i);
  if (m) return m[1].trim();
  // Austrian city mentions
  const cities = ["Wien", "Vienna", "Linz", "Graz", "Salzburg", "Innsbruck"];
  for (const city of cities) {
    if (description.includes(city)) return `${city}, Österreich`;
  }
  return null;
}

export async function crawlMeetup(): Promise<UnifiedEvent[]> {
  const results: UnifiedEvent[] = [];
  const seenUrls = new Set<string>();

  for (const group of MEETUP_GROUPS) {
    try {
      const res = await fetch(
        `https://www.meetup.com/${group}/events/rss/`,
        {
          headers: { "User-Agent": "YAIL-Event-Radar/1.0" },
          next: { revalidate: 0 },
        }
      );

      if (!res.ok) {
        // Group might not exist — silently skip
        continue;
      }

      const xml = await res.text();
      const items = parseRssItems(xml);

      for (const item of items) {
        if (!item.link || seenUrls.has(item.link)) continue;
        seenUrls.add(item.link);

        results.push({
          title: item.title,
          date: extractDate(item.pubDate),
          location: extractLocation(item.description) ?? "Österreich",
          url: item.link,
          source: "meetup",
          rawDescription: item.description.replace(/<[^>]+>/g, "").slice(0, 500),
        });
      }
    } catch (err) {
      console.warn(`[meetup] RSS fetch failed for group "${group}":`, err);
    }
  }

  console.log(`[meetup] ${results.length} events from ${MEETUP_GROUPS.length} groups`);
  return results;
}
