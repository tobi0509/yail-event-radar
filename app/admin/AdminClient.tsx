"use client";

import { useState } from "react";
import type { Event } from "@/lib/schema";

interface AdminClientProps {
  unconfirmed: Event[];
  confirmed: Event[];
  crawlSecret: string;
}

// --- Review Card (Bestätigen / Ablehnen) ---

function ReviewCard({
  event,
  crawlSecret,
  onDone,
}: {
  event: Event;
  crawlSecret: string;
  onDone: (id: number) => void;
}) {
  const [loading, setLoading] = useState<"confirm" | "reject" | null>(null);
  const [date, setDate] = useState(event.date ?? "");
  const [location, setLocation] = useState(event.location ?? "");
  const [imageUrl, setImageUrl] = useState(event.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${crawlSecret}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url: string };
      setImageUrl(data.url);
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirm() {
    setLoading("confirm");
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${crawlSecret}`,
        },
        body: JSON.stringify({
          confirmed: true,
          ...(date && date !== event.date ? { date } : {}),
          ...(location !== (event.location ?? "") ? { location: location || null } : {}),
          ...(imageUrl !== (event.imageUrl ?? "") ? { imageUrl: imageUrl || null } : {}),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onDone(event.id);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${crawlSecret}` },
      });
      if (!res.ok) throw new Error(await res.text());
      onDone(event.id);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E3E6EA] overflow-hidden flex flex-col">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="w-full aspect-[2/1] object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="w-full h-16 bg-gradient-to-br from-[#A3C4F3] to-[#B8E0D2] opacity-40" />
      )}

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-[#B0B0B0] bg-[#F2F4F7] px-2 py-0.5 rounded-full">
            {event.source}
          </span>
          {event.category && (
            <span className="text-xs font-mono text-[#B0B0B0]">{event.category}</span>
          )}
        </div>

        <p className="font-poppins font-semibold text-[14px] text-[#1A1A1A] leading-snug">
          {event.title}
        </p>

        {event.description && (
          <p className="text-xs font-inter text-[#4B4B4B] leading-relaxed line-clamp-3">
            {event.description}
          </p>
        )}

        {event.location && (
          <p className="text-xs font-mono text-[#B0B0B0]">{event.location}</p>
        )}

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

        {/* Image */}
        <div className="flex gap-2 items-center">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Bild-URL (https://…)"
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-[#E3E6EA] focus:border-[#A3C4F3] outline-none bg-[#FAFAFA] min-w-0"
          />
          <label className={`flex-shrink-0 text-sm font-poppins font-semibold px-3 py-2 rounded-xl border border-[#E3E6EA] cursor-pointer transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-[#A3C4F3]"} text-[#4B4B4B]`}>
            {uploading ? "…" : "Hochladen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* Date — highlighted if missing */}
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${!date ? "border-[#FDD2BF] bg-[#FFF8F5]" : "border-[#E3E6EA] bg-[#FAFAFA]"}`}>
          <span className="text-xs font-mono text-[#B0B0B0] flex-shrink-0 w-10">Datum</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-[#1A1A1A]"
          />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border border-[#E3E6EA] bg-[#FAFAFA]">
          <span className="text-xs font-mono text-[#B0B0B0] flex-shrink-0 w-10">Ort</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="z.B. Wien · Online · Amsterdam"
            className="flex-1 text-sm bg-transparent outline-none text-[#1A1A1A] placeholder:text-[#C0C0C0]"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={handleConfirm}
            disabled={loading !== null}
            className="flex-1 text-sm font-poppins font-semibold px-3 py-2 rounded-full bg-gradient-to-br from-[#A3C4F3] to-[#B8E0D2] text-[#1A1A1A] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === "confirm" ? "..." : "Bestätigen"}
          </button>
          <button
            onClick={handleReject}
            disabled={loading !== null}
            className="flex-1 text-sm font-poppins font-semibold px-3 py-2 rounded-full border border-[#E3E6EA] text-[#4B4B4B] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {loading === "reject" ? "..." : "Ablehnen"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Edit Row (Bilder / Beschreibung für bestätigte Events) ---

function EventRow({
  event,
  crawlSecret,
}: {
  event: Event;
  crawlSecret: string;
}) {
  const [imageUrl, setImageUrl] = useState(event.imageUrl ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [date, setDate] = useState(event.date ?? "");
  const [location, setLocation] = useState(event.location ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${crawlSecret}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url: string };
      setImageUrl(data.url);
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
    }
  }

  const hasChanges =
    imageUrl !== (event.imageUrl ?? "") ||
    description !== (event.description ?? "") ||
    date !== (event.date ?? "") ||
    location !== (event.location ?? "");

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
          date: date || null,
          location: location || null,
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
          <span className="text-2xl text-[#B0B0B0]">—</span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-[#B0B0B0] bg-[#F2F4F7] px-2 py-0.5 rounded-full">
              {event.source}
            </span>
            <span className="text-xs font-mono text-[#B0B0B0]">{formattedDate}</span>
          </div>
          <p className="font-poppins font-semibold text-[15px] text-[#1A1A1A] mt-1 truncate">
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

        {/* Date */}
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${!date ? "border-[#FDD2BF] bg-[#FFF8F5]" : "border-[#E3E6EA] bg-[#FAFAFA]"}`}>
          <span className="text-xs font-mono text-[#B0B0B0] flex-shrink-0 w-10">Datum</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-[#1A1A1A]"
          />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border border-[#E3E6EA] bg-[#FAFAFA]">
          <span className="text-xs font-mono text-[#B0B0B0] flex-shrink-0 w-10">Ort</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="z.B. Wien · Online · Amsterdam"
            className="flex-1 text-sm bg-transparent outline-none text-[#1A1A1A] placeholder:text-[#C0C0C0]"
          />
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Bild-URL (https://…)"
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-[#E3E6EA] focus:border-[#A3C4F3] outline-none bg-[#FAFAFA] min-w-0"
          />
          <label className={`flex-shrink-0 text-sm font-poppins font-semibold px-3 py-2 rounded-xl border border-[#E3E6EA] cursor-pointer transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-[#A3C4F3] hover:text-[#1A1A1A]"} text-[#4B4B4B]`}>
            {uploading ? "…" : "Hochladen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-xs text-[#B0B0B0]">JPG / PNG / WebP · max. 5 MB · ideal 1200 × 600 px</p>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kurzbeschreibung (2 Sätze)…"
          rows={2}
          className="text-sm px-3 py-2 rounded-xl border border-[#E3E6EA] focus:border-[#A3C4F3] outline-none bg-[#FAFAFA] resize-none"
        />

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
            {saving ? "Speichern…" : saved ? "Gespeichert" : "Speichern"}
          </button>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}

// --- Main AdminClient ---

export function AdminClient({ unconfirmed, confirmed, crawlSecret }: AdminClientProps) {
  const [tab, setTab] = useState<"review" | "edit">(
    unconfirmed.length > 0 ? "review" : "edit"
  );
  const [pendingList, setPendingList] = useState(unconfirmed);
  const [filter, setFilter] = useState<"all" | "missing">("missing");

  function handleReviewDone(id: number) {
    setPendingList((prev) => prev.filter((e) => e.id !== id));
  }

  const editFiltered =
    filter === "missing" ? confirmed.filter((e) => !e.imageUrl) : confirmed;

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("review")}
          className={`text-sm font-poppins font-semibold px-4 py-2 rounded-full transition-colors ${
            tab === "review"
              ? "bg-[#FDD2BF] text-[#1A1A1A]"
              : "bg-white border border-[#E3E6EA] text-[#4B4B4B] hover:border-[#FDD2BF]"
          }`}
        >
          Zu bestätigen ({pendingList.length})
        </button>
        <button
          onClick={() => setTab("edit")}
          className={`text-sm font-poppins font-semibold px-4 py-2 rounded-full transition-colors ${
            tab === "edit"
              ? "bg-[#A3C4F3] text-[#1A1A1A]"
              : "bg-white border border-[#E3E6EA] text-[#4B4B4B] hover:border-[#A3C4F3]"
          }`}
        >
          Bestätigt ({confirmed.length})
        </button>
      </div>

      {/* Review Tab */}
      {tab === "review" && (
        <>
          {pendingList.length === 0 ? (
            <div className="text-center py-16 text-[#B0B0B0] font-inter">
              Alles bestätigt.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingList.map((event) => (
                <ReviewCard
                  key={event.id}
                  event={event}
                  crawlSecret={crawlSecret}
                  onDone={handleReviewDone}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit Tab */}
      {tab === "edit" && (
        <>
          <div className="flex gap-2">
            {(["missing", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm font-poppins font-semibold px-4 py-2 rounded-full transition-colors ${
                  filter === f
                    ? "bg-[#A3C4F3] text-[#1A1A1A]"
                    : "bg-white border border-[#E3E6EA] text-[#4B4B4B] hover:border-[#A3C4F3]"
                }`}
              >
                {f === "missing"
                  ? `Ohne Bild (${confirmed.filter((e) => !e.imageUrl).length})`
                  : `Alle (${confirmed.length})`}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {editFiltered.map((event) => (
              <EventRow key={event.id} event={event} crawlSecret={crawlSecret} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
