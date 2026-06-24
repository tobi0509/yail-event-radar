export interface UnifiedEvent {
  title: string;
  date: string | null; // YYYY-MM-DD
  location: string | null;
  url: string;
  source: "meetup" | "eventbrite" | "google";
  rawDescription?: string; // max 500 chars, sent to Gemini
}
