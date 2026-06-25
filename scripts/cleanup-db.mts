import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql as vercelSql } from "@vercel/postgres";
import { events } from "../lib/schema";
import { isAiRelevant } from "../lib/filter-ai";
import { eq } from "drizzle-orm";

const db = drizzle(vercelSql);

const all = await db.select().from(events);
console.log(`Gesamt: ${all.length} Events`);

let deleted = 0;
let kept = 0;

for (const event of all) {
  const relevant = isAiRelevant(event.title, event.description ?? undefined);
  if (!relevant) {
    await db.delete(events).where(eq(events.id, event.id));
    deleted++;
  } else {
    kept++;
  }
}

console.log(`Gelöscht: ${deleted} | Behalten: ${kept}`);
