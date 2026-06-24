"use client";

import { useState } from "react";
import { ScoreBadge } from "./ScoreBadge";
import { CategoryTag } from "./CategoryTag";
import type { Event } from "@/lib/schema";

interface EventCardProps {
  event: Event;
}

const SOURCE_LABELS: Record<string, string> = {
  meetup: "Meetup",
  eventbrite: "Eventbrite",
  google: "Web",
};

function buildCalendarUrl(event: Event): string {
  const title = encodeURIComponent(event.title);
  const loc = encodeURIComponent(event.location ?? "");
  let dates = "";
  if (event.date) {
    const d = event.date.replace(/-/g, "");
    dates = `${d}T090000/${d}T180000`;
  }
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${loc}`;
}

function StarRating({
  eventId,
  initialScore,
  initialCount,
}: {
  eventId: number;
  initialScore: number | null;
  initialCount: number | null;
}) {
  const storageKey = `rated_${eventId}`;
  const alreadyRated =
    typeof window !== "undefined" && Boolean(localStorage.getItem(storageKey));

  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(alreadyRated);
  const [score, setScore] = useState(initialScore);
  const [count, setCount] = useState(initialCount ?? 0);

  async function handleRate(stars: number) {
    if (submitted) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars }),
      });
      if (res.ok) {
        const data = (await res.json()) as { score: number; ratingCount: number };
        setScore(data.score);
        setCount(data.ratingCount);
        setSubmitted(true);
        localStorage.setItem(storageKey, "1");
      }
    } catch {
      // silent — rating failure shouldn't break the card
    }
  }

  if (submitted) {
    return <ScoreBadge score={score} ratingCount={count} />;
  }

  return (
    <div className="flex items-center gap-1" title="War ich dabei — bewerten">
      <span className="text-xs font-inter text-[#B0B0B0] mr-1 hidden sm:inline">War ich dabei:</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => handleRate(star)}
          className="text-xl leading-none transition-colors"
          style={{ color: star <= (hovered || 0) ? "#A3C4F3" : "#E3E6EA" }}
          aria-label={`${star} Sterne`}
        >
          ★
        </button>
      ))}
      {count > 0 && (
        <span className="text-xs font-mono text-[#B0B0B0] ml-1">({count})</span>
      )}
    </div>
  );
}

export function EventCard({ event }: EventCardProps) {
  const formattedDate = event.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString("de-AT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Datum unbekannt";

  const sourceLabel = event.source ? SOURCE_LABELS[event.source] ?? event.source : null;
  const isPast = event.status === "past";

  return (
    <article
      className={`bg-card rounded-card p-8 border border-border shadow-[0_2px_8px_rgba(163,196,243,0.08)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col gap-4 ${
        isPast ? "opacity-60" : ""
      }`}
    >
      {/* Top row: category + past badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <CategoryTag category={event.category ?? "Other"} />
        {isPast && (
          <span className="text-xs font-mono text-[#B0B0B0] px-2 py-1 bg-[#F2F4F7] rounded-cta">
            Vergangen
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="font-poppins font-semibold text-[22px] leading-snug text-primary-text">
        {event.title}
      </h2>

      {/* Date & location */}
      <div className="flex items-center gap-3 text-sm flex-wrap">
        <span className="font-mono text-secondary-text">{formattedDate}</span>
        {event.location && (
          <>
            <span className="text-border">·</span>
            <span className="font-inter text-secondary-text">{event.location}</span>
          </>
        )}
        {sourceLabel && (
          <>
            <span className="text-border">·</span>
            <span className="text-xs font-mono text-[#B0B0B0]">via {sourceLabel}</span>
          </>
        )}
      </div>

      {/* Community rating */}
      <div className="pt-1">
        <StarRating
          eventId={event.id}
          initialScore={event.score ?? null}
          initialCount={event.ratingCount ?? null}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-inter font-medium px-4 py-2 rounded-cta border border-border text-secondary-text hover:border-accent-blue hover:text-primary-text transition-colors"
          >
            Details →
          </a>
        )}
        <a
          href={buildCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-poppins font-semibold px-4 py-2 rounded-cta bg-gradient-to-br from-accent-blue to-mint text-primary-text hover:opacity-90 transition-opacity"
        >
          + Kalender
        </a>
      </div>
    </article>
  );
}
