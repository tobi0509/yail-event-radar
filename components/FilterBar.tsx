"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterBarProps {
  totalCount?: number;
}

const CATEGORIES = [
  "Conference",
  "Meetup",
  "Workshop",
  "Hackathon",
  "Networking",
  "Webinar",
  "Other",
];

export function FilterBar({ totalCount }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";
  const activeStatus = searchParams.get("status") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleCategory = (cat: string) => {
    updateParam("category", activeCategory === cat ? "" : cat);
  };

  const hasActiveFilters = activeCategory !== "" || activeStatus !== "";

  return (
    <div className="flex flex-col gap-4">
      {/* Active filter count + reset */}
      {hasActiveFilters && totalCount !== undefined && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-[#4B4B4B]">
            {totalCount} {totalCount === 1 ? "Event" : "Events"} gefunden
          </span>
          <button
            onClick={() => router.push("/")}
            className="text-xs font-inter text-[#A3C4F3] hover:text-[#1A1A1A] transition-colors underline underline-offset-2"
          >
            Filter zurücksetzen
          </button>
        </div>
      )}

      {/* Status pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-inter font-medium text-secondary-text uppercase tracking-wide mr-1">
          Zeitraum
        </span>
        {[
          { label: "Alle", value: "" },
          { label: "Bevorstehend", value: "upcoming" },
          { label: "Vergangen", value: "past" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => updateParam("status", s.value)}
            className={`px-4 py-2 rounded-cta text-sm font-inter font-medium transition-all ${
              activeStatus === s.value
                ? "bg-accent-blue text-primary-text"
                : "bg-white border border-border text-secondary-text hover:border-accent-blue"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-inter font-medium text-secondary-text uppercase tracking-wide mr-1">
          Kategorie
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`px-4 py-2 rounded-cta text-sm font-inter font-medium transition-all ${
              activeCategory === cat
                ? "bg-accent-blue text-primary-text"
                : "bg-white border border-border text-secondary-text hover:border-accent-blue"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
