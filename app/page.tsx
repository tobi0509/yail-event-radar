import { Suspense } from "react";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { asc, desc } from "drizzle-orm";
import { EventGrid } from "@/components/EventGrid";
import { FilterBar } from "@/components/FilterBar";
import { DEMO_EVENTS } from "@/lib/demo-events";

async function getInitialEvents(): Promise<{ data: typeof DEMO_EVENTS; isDemo: boolean }> {
  try {
    const data = await db
      .select()
      .from(events)
      .orderBy(asc(events.date), desc(events.createdAt));
    if (data.length === 0) return { data: DEMO_EVENTS, isDemo: true };
    return { data, isDemo: false };
  } catch {
    return { data: DEMO_EVENTS, isDemo: true };
  }
}

export default async function HomePage() {
  const { data: initialEvents, isDemo } = await getInitialEvents();

  return (
    <div className="flex flex-col gap-12">
      {/* Page title block */}
      <div className="flex flex-col gap-4 pt-4">
        <h1 className="font-poppins font-bold text-[48px] leading-tight text-[#1A1A1A]">
          AI Event Radar
        </h1>
        <div className="w-16 h-[3px] rounded-full bg-gradient-to-r from-[#A3C4F3] to-[#B8E0D2]" />
        <p className="font-inter font-normal text-[20px] text-[#4B4B4B] max-w-xl">
          Alle KI-Events in Österreich — auf einen Blick.
        </p>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-card bg-[#FDD2BF]/30 border border-[#FDD2BF]">
          <span className="text-base">🔧</span>
          <p className="font-inter text-sm text-[#4B4B4B]">
            <strong className="text-[#1A1A1A]">Demo-Modus</strong> — Keine Datenbankverbindung. Diese Events sind Beispieldaten aus der österreichischen AI-Community.
          </p>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm font-mono text-[#4B4B4B]">
        <span>{initialEvents.length} Events</span>
        <span className="text-[#E3E6EA]">·</span>
        <span>
          {initialEvents.filter((e) => (e.ratingCount ?? 0) > 0).length} bereits bewertet
        </span>
        <span className="text-[#E3E6EA]">·</span>
        <span>Wöchentlich aktualisiert</span>
      </div>

      {/* Filter bar */}
      <Suspense fallback={null}>
        <FilterBar totalCount={initialEvents.length} />
      </Suspense>

      {/* CTA Strip */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-card border border-dashed border-[#A3C4F3] bg-[#F2F4F7]">
        <p className="font-inter text-sm text-[#4B4B4B]">
          Du kennst ein KI-Event das hier fehlt?
        </p>
        <a
          href="/kontakt"
          className="flex-shrink-0 font-poppins text-sm font-semibold px-4 py-2 rounded-cta bg-gradient-to-br from-[#A3C4F3] to-[#B8E0D2] text-[#1A1A1A] hover:opacity-90 transition-opacity"
        >
          Einreichen →
        </a>
      </div>

      {/* Event grid */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-card p-8 border border-[#E3E6EA] h-64 animate-pulse"
              />
            ))}
          </div>
        }
      >
        <EventGrid initialEvents={initialEvents} />
      </Suspense>
    </div>
  );
}
