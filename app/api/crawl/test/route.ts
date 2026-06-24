import { NextRequest, NextResponse } from "next/server";
import { crawlMeetup } from "@/lib/crawlers/meetup";
import { crawlEventbrite } from "@/lib/crawlers/eventbrite";
import { crawlAsai } from "@/lib/crawlers/asai";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source");

  try {
    switch (source) {
      case "meetup":
        return NextResponse.json(await crawlMeetup());
      case "eventbrite":
        return NextResponse.json(await crawlEventbrite());
      case "asai":
        return NextResponse.json(await crawlAsai());
      default:
        return NextResponse.json(
          { error: "?source= must be one of: meetup, eventbrite, asai" },
          { status: 400 }
        );
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
