import type { UnifiedEvent } from "@/lib/types";

interface MeetupVenue {
  city?: string;
  country?: string;
}

interface MeetupEvent {
  name?: string;
  time?: number;
  link?: string;
  description?: string;
  venue?: MeetupVenue;
}

interface MeetupResponse {
  events?: MeetupEvent[];
}

export async function crawlMeetup(): Promise<UnifiedEvent[]> {
  const key = process.env.MEETUP_API_KEY;
  if (!key) {
    console.warn("[meetup] MEETUP_API_KEY not set, skipping");
    return [];
  }

  const params = new URLSearchParams({
    country: "AT",
    text: "artificial intelligence machine learning AI",
    page: "50",
    key,
  });

  const res = await fetch(
    `https://api.meetup.com/find/upcoming_events?${params}`,
    { next: { revalidate: 0 } }
  );

  if (!res.ok) {
    console.error(`[meetup] HTTP ${res.status}: ${await res.text()}`);
    return [];
  }

  const data: MeetupResponse = await res.json();
  const raw = data.events ?? [];

  return raw
    .filter((e): e is MeetupEvent & { name: string; link: string } =>
      Boolean(e.name && e.link)
    )
    .map((e) => ({
      title: e.name,
      date: e.time ? new Date(e.time).toISOString().slice(0, 10) : null,
      location: e.venue?.city
        ? `${e.venue.city}, ${e.venue.country ?? "AT"}`
        : null,
      url: e.link,
      source: "meetup" as const,
      rawDescription: e.description?.slice(0, 500),
    }));
}
