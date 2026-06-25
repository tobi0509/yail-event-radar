"use client";

import { useState } from "react";
import type { Event } from "@/lib/schema";

interface AdminClientProps {
  events: Event[];
  crawlSecret: string;
}

function EventRow({
  event,
  crawlSecret,
}: {
  event: Event;
  crawlSecret: string;
}) {
  const [imageUrl, setImageUrl] = useState(event.imageUrl ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const hasChanges =
    imageUrl !== (event.imageUrl ?? "") ||
    description !== (event.description ?? "");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${crawlSecret}`,
        },
        body: JSON.stringify({
          imageUrl: imageUrl || null,
          description: description || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const formattedDate = event.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString("de-AT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "–";

  return (
    <div
      className={`bg-white rounded-2xl border p-5 flex gap-4 transition-all ${
        event.imageUrl ? "border-[#E3E6EA]" : "border-[#FDD2BF]"
      }`}
    >
      {/* Bild-Vorschau */}
      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#F2F4F7] flex items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-2xl">🖼️</span>
        )}
      </div>

      {/* Inhalt */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {/* Titel + Meta */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-[#B0B0B0] bg-[#F2F4F7] px-2 py-0.5 rounded-full">
              {event.source}
            </span>
            <span className="text-xs font-mono text-[#B0B0B0]">
              {formattedDate}
            </span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                event.status === "upcoming"
                  ? "bg-[#B8E0D2] text-[#1A1A1A]"
                  : "bg-[#F2F4F7] text-[#B0B0B0]"
              }`}
            >
              {event.status}
            </span>
          </div>
          <p className="font-poppins font-semibold text-[15px] text-primary-text mt-1 truncate">
            {event.title}
          </p>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#A3C4F3] hover:underline truncate block"
            >
              {event.url}
            </a>
          )}
        </div>

        {/* Bild URL */}
        <div className="flex gap-2 items-center">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Bild-URL einfügen (https://…)"
            className="flex-1 text-sm font-inter px-3 py-2 rounded-xl border border-[#E3E6EA] focus:border-[#A3C4F3] outline-none bg-[#FAFAFA] min-w-0"
          />
        </div>

        {/* Beschreibung */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kurzbeschreibung (2 Sätze)…"
          rows={2}
          className="text-sm font-inter px-3 py-2 rounded-xl border border-[#E3E6EA] focus:border-[#A3C4F3] outline-none bg-[#FAFAFA] resize-none"
        />

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`text-sm font-poppins font-semibold px-4 py-2 rounded-full transition-all ${
              saved
                ? "bg-[#B8E0D2] text-[#1A1A1A]"
                : hasChanges
                ? "bg-gradient-to-br from-[#A3C4F3] to-[#B8E0D2] text-[#1A1A1A] hover:opacity-90"
                : "bg-[#F2F4F7] text-[#B0B0B0] cursor-not-allowed"
            }`}
          >
            {saving ? "Speichern…" : saved ? "✓ Gespeichert" : "Speichern"}
          </button>
          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminClient({ events, crawlSecret }: AdminClientProps) {
  const [filter, setFilter] = useState<"all" | "missing">("missing");

  const filtered =
    filter === "missing" ? events.filter((e) => !e.imageUrl) : events;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-2">
        {(["missing", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm font-poppins font-semibold px-4 py-2 rounded-full transition-colors ${
              filter === f
                ? "bg-[#A3C4F3] text-[#1A1A1A]"
                : "bg-white border border-[#E3E6EA] text-secondary-text hover:border-[#A3C4F3]"
            }`}
          >
            {f === "missing"
              ? `Ohne Bild (${events.filter((e) => !e.imageUrl).length})`
              : `Alle (${events.length})`}
          </button>
        ))}
      </div>

      {filtered.map((event) => (
        <EventRow key={event.id} event={event} crawlSecret={crawlSecret} />
      ))}
    </div>
  );
}
