import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

// POST /api/events/[id]/rate  →  { stars: 1-5 }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json()) as { stars?: unknown };
  const stars = typeof body.stars === "number" ? Math.round(body.stars) : NaN;

  if (isNaN(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "stars must be 1–5" }, { status: 400 });
  }

  try {
    // Atomic update: recalculate running average
    const updated = await db
      .update(events)
      .set({
        ratingCount: sql`${events.ratingCount} + 1`,
        score: sql`
          CASE
            WHEN ${events.ratingCount} = 0 THEN ${stars}
            ELSE ROUND(
              (COALESCE(${events.score}, 0) * ${events.ratingCount} + ${stars})
              / (${events.ratingCount} + 1)::numeric,
              1
            )
          END
        `,
      })
      .where(eq(events.id, id))
      .returning({ score: events.score, ratingCount: events.ratingCount });

    if (updated.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error("[POST /api/events/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/events/[id]  →  admin-only status update
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const secret = process.env.CRAWL_SECRET;
  if (!secret || request.headers.get("Authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json()) as { status?: unknown };
  const status = body.status;
  if (status !== "upcoming" && status !== "past") {
    return NextResponse.json({ error: "status must be upcoming or past" }, { status: 400 });
  }

  const updated = await db
    .update(events)
    .set({ status })
    .where(eq(events.id, id))
    .returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}
