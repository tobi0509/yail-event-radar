import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql as vercelSql } from "@vercel/postgres";
import { events } from "../lib/schema";
import { like, isNotNull } from "drizzle-orm";

const db = drizzle(vercelSql);

// Fix locations like "in person, Österreich" → "Österreich"
// and "in person, Wien" → "Wien"
const FORMAT_PREFIX = /^(?:in person|online|hybrid|virtual|in-person)[,\s]+/i;

const all = await db
  .select({ id: events.id, location: events.location })
  .from(events)
  .where(isNotNull(events.location));

let fixed = 0;
for (const row of all) {
  if (!row.location) continue;
  const cleaned = row.location.replace(FORMAT_PREFIX, "").trim();
  if (cleaned !== row.location) {
    await db
      .update(events)
      .set({ location: cleaned || null })
      // @ts-ignore
      .where(vercelSql`id = ${row.id}`);
    console.log(`  "${row.location}" → "${cleaned}"`);
    fixed++;
  }
}
console.log(`Done — ${fixed} Locations bereinigt`);
