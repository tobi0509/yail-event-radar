export interface UnifiedEvent {
  title: string;
  date: string | null; // YYYY-MM-DD
  location: string | null;
  url: string;
  source: "meetup" | "eventbrite" | "asai" | "aiaustria" | "aiat" | "confeurope" | "allconf";
  rawDescription?: string;
}
