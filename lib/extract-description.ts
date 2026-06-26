// Extrahiert eine 2-Satz-Kurzbeschreibung aus rohem Text
export function extractDescription(raw?: string): string | null {
  if (!raw) return null;

  // HTML-Tags entfernen, whitespace normalisieren
  const clean = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    // Strip leading separators and format labels ("/ in person", "/ online", "/")
    .replace(/^[/\s]+(?:in person|online|hybrid|virtual|in-person)?\s*/i, "")
    .replace(/^\/\s*/, "")
    .trim();

  if (clean.length < 20) return null;

  // Ersten 2 Sätze extrahieren
  const sentenceRegex = /[^.!?]*[.!?]+/g;
  const sentences: string[] = [];
  let match;

  while ((match = sentenceRegex.exec(clean)) !== null && sentences.length < 2) {
    const s = match[0].trim();
    if (s.length > 15) sentences.push(s);
  }

  if (sentences.length > 0) {
    return sentences.join(" ").slice(0, 300);
  }

  // Fallback: erste 250 Zeichen
  return clean.slice(0, 250) + (clean.length > 250 ? "…" : "");
}
