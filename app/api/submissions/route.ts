import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions } from "@/lib/schema";

interface SubmissionBody {
  name?: unknown;
  email?: unknown;
  eventTitle?: unknown;
  eventUrl?: unknown;
  eventDate?: unknown;
  eventLocation?: unknown;
  message?: unknown;
  _hp?: unknown; // honeypot — must be empty
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmissionBody;

    // Honeypot: bots fill hidden fields, humans don't
    if (body._hp) {
      return NextResponse.json({ success: true }); // silent discard
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const eventTitle = typeof body.eventTitle === "string" ? body.eventTitle.trim() : "";

    if (!name || !email || !eventTitle) {
      return NextResponse.json(
        { error: "Name, E-Mail und Event-Titel sind Pflichtfelder." },
        { status: 400 }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Bitte eine gültige E-Mail-Adresse eingeben." },
        { status: 400 }
      );
    }

    await db.insert(submissions).values({
      name,
      email,
      eventTitle,
      eventUrl: typeof body.eventUrl === "string" ? body.eventUrl.trim() || null : null,
      eventDate: typeof body.eventDate === "string" ? body.eventDate || null : null,
      eventLocation: typeof body.eventLocation === "string" ? body.eventLocation.trim() || null : null,
      message: typeof body.message === "string" ? body.message.trim() || null : null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/submissions]", err);
    return NextResponse.json({ error: "Interner Fehler. Bitte später nochmal versuchen." }, { status: 500 });
  }
}
