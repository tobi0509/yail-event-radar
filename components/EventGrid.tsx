"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { EventCard } from "./EventCard";
import type { Event } from "@/lib/schema";

interface EventGridProps {
  initialEvents: Event[];
}

export function EventGrid({ initialEvents }: EventGridProps) {
  const searchParams = useSearchParams();
  const [eventList, setEventList] = useState<Event[]>(initialEvents);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?${searchParams.toString()}`);
      if (res.ok) {
        const data: Event[] = await res.json();
        setEventList(data);
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-card p-8 border border-border h-64 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (eventList.length === 0) {
    const hasFilters = typeof window !== "undefined" && window.location.search.length > 0;
    return (
      <div className="text-center py-24 border border-dashed border-[#E3E6EA] rounded-card">
        <p className="font-poppins text-2xl font-semibold text-[#1A1A1A] mb-3">
          {hasFilters ? "Keine Events gefunden" : "Noch keine Events"}
        </p>
        <p className="font-inter text-[#4B4B4B] mb-6">
          {hasFilters
            ? "Versuche andere Filter oder entferne sie um alle Events zu sehen."
            : "Richte die Datenbank ein und starte den ersten Crawl."}
        </p>
        {!hasFilters && (
          <code className="font-mono text-sm bg-[#F2F4F7] px-4 py-2 rounded-lg text-[#4B4B4B]">
            POST /api/crawl · Authorization: Bearer &lt;CRAWL_SECRET&gt;
          </code>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {eventList.map((event) => (
        <EventCard key={event.id} event={event}  />
      ))}
    </div>
  );
}
