import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql as vercelSql } from "@vercel/postgres";
import { events } from "../lib/schema";

const db = drizzle(vercelSql);
const result = await db.update(events).set({ confirmed: true });
console.log("Done — alle bestehenden Events auf confirmed=true gesetzt");
