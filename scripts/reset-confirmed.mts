import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql as vercelSql } from "@vercel/postgres";
import { events } from "../lib/schema";
import { eq } from "drizzle-orm";

const db = drizzle(vercelSql);

// Delete all past events
const deleted = await db.delete(events).where(eq(events.status, "past")).returning({ id: events.id });
console.log(`Gelöscht: ${deleted.length} vergangene Events`);

// Set all remaining to confirmed=false
const updated = await db.update(events).set({ confirmed: false }).returning({ id: events.id });
console.log(`Auf unbestätigt gesetzt: ${updated.length} Events`);
