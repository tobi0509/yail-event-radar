"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full px-4 py-3 rounded-[12px] border border-[#E3E6EA] bg-white text-[#1A1A1A] font-inter text-base placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#A3C4F3] focus:ring-2 focus:ring-[#A3C4F3]/20 transition-all";

const labelClass = "block font-inter font-medium text-sm text-[#4B4B4B] mb-2";

export default function KontaktPage() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [fields, setFields] = useState({
    name: "",
    email: "",
    eventTitle: "",
    eventUrl: "",
    eventDate: "",
    eventLocation: "",
    message: "",
    _hp: "", // honeypot — hidden from humans
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setErrorMsg(data.error ?? "Unbekannter Fehler.");
        setFormState("error");
        return;
      }

      setFormState("success");
    } catch {
      setErrorMsg("Netzwerkfehler. Bitte nochmal versuchen.");
      setFormState("error");
    }
  }

  if (formState === "success") {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-8 pt-4">
        <div className="flex flex-col gap-4">
          <h1 className="font-poppins font-bold text-[48px] leading-tight text-[#1A1A1A]">
            Danke!
          </h1>
          <div className="w-16 h-[3px] rounded-full bg-gradient-to-r from-[#A3C4F3] to-[#B8E0D2]" />
        </div>

        <div className="bg-white rounded-card p-8 border border-[#E3E6EA]">
          <p className="font-inter text-[20px] text-[#1A1A1A] mb-2">
            Deine Anfrage ist eingegangen.
          </p>
          <p className="font-inter text-[#4B4B4B]">
            Wir prüfen das Event und melden uns bei dir wenn es auf dem Radar erscheint.
          </p>
        </div>

        <a
          href="/"
          className="self-start font-poppins font-semibold px-6 py-3 rounded-cta bg-gradient-to-br from-[#A3C4F3] to-[#B8E0D2] text-[#1A1A1A] hover:opacity-90 transition-opacity"
        >
          ← Zurück zu den Events
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-10 pt-4">
      {/* Page title */}
      <div className="flex flex-col gap-4">
        <h1 className="font-poppins font-bold text-[48px] leading-tight text-[#1A1A1A]">
          Event einreichen
        </h1>
        <div className="w-16 h-[3px] rounded-full bg-gradient-to-r from-[#A3C4F3] to-[#B8E0D2]" />
        <p className="font-inter font-normal text-[20px] text-[#4B4B4B]">
          Du veranstaltest ein KI-Event in Österreich oder kennst eines das fehlt? Meld es hier — wir prüfen und nehmen es auf.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Contact info */}
        <div className="bg-white rounded-card p-8 border border-[#E3E6EA] flex flex-col gap-6">
          <h2 className="font-poppins font-semibold text-[22px] text-[#1A1A1A]">
            Deine Kontaktdaten
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className={labelClass}>
                Name / Organisation <span className="text-[#FDD2BF]">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="z. B. TU Wien AI Club"
                value={fields.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                E-Mail <span className="text-[#FDD2BF]">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="deine@email.at"
                value={fields.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Event info */}
        <div className="bg-white rounded-card p-8 border border-[#E3E6EA] flex flex-col gap-6">
          <h2 className="font-poppins font-semibold text-[22px] text-[#1A1A1A]">
            Event-Details
          </h2>

          <div>
            <label htmlFor="eventTitle" className={labelClass}>
              Event-Titel <span className="text-[#FDD2BF]">*</span>
            </label>
            <input
              id="eventTitle"
              name="eventTitle"
              type="text"
              required
              placeholder="z. B. Vienna AI Meetup #12"
              value={fields.eventTitle}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="eventUrl" className={labelClass}>
              Link zum Event
            </label>
            <input
              id="eventUrl"
              name="eventUrl"
              type="url"
              placeholder="https://meetup.com/..."
              value={fields.eventUrl}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventDate" className={labelClass}>
                Datum
              </label>
              <input
                id="eventDate"
                name="eventDate"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={fields.eventDate}
                onChange={handleChange}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label htmlFor="eventLocation" className={labelClass}>
                Ort
              </label>
              <input
                id="eventLocation"
                name="eventLocation"
                type="text"
                placeholder="z. B. Wien, WU Campus"
                value={fields.eventLocation}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className={labelClass}>
              Weitere Infos / Nachricht
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Was macht das Event besonders? Zielgruppe, Programm, Speaker..."
              value={fields.message}
              onChange={handleChange}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Error */}
        {formState === "error" && (
          <div className="px-4 py-3 rounded-[12px] bg-[#FDD2BF]/40 border border-[#FDD2BF] text-[#1A1A1A] font-inter text-sm">
            {errorMsg}
          </div>
        )}

          {/* Honeypot — hidden from users, filled by bots */}
        <div aria-hidden="true" className="hidden">
          <input
            name="_hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={fields._hp}
            onChange={handleChange}
          />
        </div>

      {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={formState === "loading"}
            className="font-poppins font-semibold px-8 py-3 rounded-cta bg-gradient-to-br from-[#A3C4F3] to-[#B8E0D2] text-[#1A1A1A] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {formState === "loading" ? "Wird gesendet…" : "Event einreichen"}
          </button>
          <a
            href="/"
            className="font-inter text-sm text-[#4B4B4B] hover:text-[#1A1A1A] transition-colors"
          >
            Abbrechen
          </a>
        </div>

        <p className="font-inter text-xs text-[#4B4B4B]">
          Pflichtfelder sind mit <span className="text-[#FDD2BF]">*</span> markiert. Wir melden uns sobald das Event auf dem Radar erscheint.
        </p>
      </form>
    </div>
  );
}
