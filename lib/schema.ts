import { pgTable, serial, text, date, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: date("date"),
  location: text("location"),
  category: text("category"),
  // Community-Rating: Durchschnitt aus allen Bewertungen (null = noch keine Bewertungen)
  score: real("score"),
  ratingCount: integer("rating_count").default(0),
  url: text("url").unique(),
  source: text("source"),
  description: text("description"),
  imageUrl: text("image_url"),
  status: text("status").default("upcoming"), // 'upcoming' | 'past'
  confirmed: boolean("confirmed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// Event-Einreichungen von externen Veranstaltern
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  eventTitle: text("event_title").notNull(),
  eventUrl: text("event_url"),
  eventDate: date("event_date"),
  eventLocation: text("event_location"),
  message: text("message"),
  reviewed: boolean("reviewed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
