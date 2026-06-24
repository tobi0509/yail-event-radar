import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { and, desc, asc, eq, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const conditions: SQL[] = [];
    if (category) conditions.push(eq(events.category, category));
    if (status) conditions.push(eq(events.status, status));

    const rows = await db
      .select()
      .from(events)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(events.date), desc(events.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
