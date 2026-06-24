import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UnifiedEvent } from "@/lib/types";

export interface GeminiScore {
  relevant: boolean;
  score: 1 | 2 | 3 | 4 | 5;
  category:
    | "Conference"
    | "Meetup"
    | "Workshop"
    | "Hackathon"
    | "Networking"
    | "Webinar"
    | "Other";
  title_clean: string;
  date_clean: string;   // YYYY-MM-DD or empty string
  location_clean: string; // "Stadt, Land"
  reason: string;
}

const FALLBACK: GeminiScore = {
  relevant: false,
  score: 1,
  category: "Other",
  title_clean: "",
  date_clean: "",
  location_clean: "",
  reason: "AI scoring failed",
};

// Rubrik — präzise Kriterien damit Gemini konsistent bewertet
const SCORING_RUBRIC = `
BEWERTUNGSRUBRIK (score 1–5):

★★★★★ (5) — Pflicht-Event für YAIL
  - Primär AI/ML-Fokus (kein bloßer Tech-Kontext)
  - In Wien, Linz, Graz oder Salzburg (oder Österreich-weit / hybrid)
  - Networking mit Peers / Speaker aus der Branche
  - Kostenlos oder günstiger Einstieg (<50€)
  - Beispiele: Vienna AI Meetup, Linz AI Night, NLP Workshop TU Wien

★★★★☆ (4) — Sehr relevant, sollte wahrgenommen werden
  - Starker AI/ML-Bezug, aber evtl. breiter Tech-Kontext
  - Österreich oder DACH-Raum
  - Professionelles Networking möglich
  - Beispiel: Data Science Austria Conference, Startup-Pitch mit AI-Fokus

★★★☆☆ (3) — Interessant, aber nicht Kern-Zielgruppe
  - AI als Teilaspekt (z. B. digitale Transformation, Industrie 4.0)
  - Oder: Top-Event aber außerhalb Österreichs (München, Zürich)
  - Oder: Online-Webinar ohne Networking-Möglichkeit
  - Beispiel: Allgemeine Tech-Konferenz mit AI-Track

★★☆☆☆ (2) — Schwach relevant, nur wenn nichts anderes verfügbar
  - AI sehr peripher erwähnt
  - Hauptthema ist etwas anderes (Finance, HR, Marketing "mit AI")
  - Beispiel: HR-Konferenz mit "KI in der Personalauswahl"-Vortrag

★☆☆☆☆ (1) — Nicht relevant
  - Kein echter AI/ML-Bezug
  - Falsch-positiv aus Crawler (AI im Sinne von "Artificial Ingredients" o. Ä.)
  - relevant: false setzen

WICHTIG:
- Events außerhalb Österreichs/DACH: maximal score 3
- Webinare ohne Live-Networking: maximal score 3
- Bezahlte Enterprise-Events (>200€): score um 1 reduzieren
- Auf Englisch oder Deutsch gleich bewerten`;

// Few-Shot-Beispiele als Anker für konsistente Bewertung
const FEW_SHOT_EXAMPLES = `
BEISPIEL-BEWERTUNGEN (als Referenz):

Input: "Vienna AI Meetup #23 | Wien, Österreich | Meetup-Gruppe mit 800 Mitgliedern, monatliche Treffen zu ML-Themen, kostenlos"
Output: {"relevant":true,"score":5,"category":"Meetup","title_clean":"Vienna AI Meetup #23","reason":"Direkt in der Kernzielgruppe: kostenloser AI-Meetup in Wien mit großer Community."}

Input: "AI & Machine Learning Conference Austria 2025 | Wien | 2-tägige Konferenz, Speaker aus Industrie und Forschung, 290€"
Output: {"relevant":true,"score":4,"category":"Conference","title_clean":"AI & Machine Learning Conference Austria 2025","reason":"Starker AI-Fokus in Wien, aber Ticketpreis reduziert Score — Studentenrabatt prüfen."}

Input: "Digital Transformation Summit DACH | München | Enterprise-Fokus, AI als Teilaspekt neben Cloud und Prozessautomatisierung, 1200€"
Output: {"relevant":true,"score":2,"category":"Conference","title_clean":"Digital Transformation Summit DACH","reason":"AI nur als Randthema, außerhalb Österreichs und teuer — für YAIL kaum relevant."}

Input: "Future of Work: KI in der HR | Online-Webinar | 1h Webinar über ChatGPT im Recruiting, kostenlos"
Output: {"relevant":false,"score":1,"category":"Webinar","title_clean":"Future of Work: KI in der HR","reason":"KI nur als HR-Tool-Kontext, kein technischer AI/ML-Inhalt, kein Networking."}`;

let client: GoogleGenerativeAI | null = null;

function getClient() {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    client = new GoogleGenerativeAI(key);
  }
  return client;
}

function clampScore(score: unknown): 1 | 2 | 3 | 4 | 5 {
  const n = typeof score === "number" ? Math.round(score) : parseInt(String(score), 10);
  if (isNaN(n) || n < 1) return 1;
  if (n > 5) return 5;
  return n as 1 | 2 | 3 | 4 | 5;
}

export async function scoreEvent(event: UnifiedEvent): Promise<GeminiScore> {
  try {
    const model = getClient().getGenerativeModel(
      { model: "gemini-2.0-flash" },
    );

    const prompt = `Du bist ein KI-Event-Kurator für YAIL (Young AI Leaders Austria).
Deine Aufgabe: Bewerte ob ein Event für junge AI-Enthusiasten (18–35) in Österreich relevant ist.

${SCORING_RUBRIC}

${FEW_SHOT_EXAMPLES}

---
JETZT BEWERTE DIESES EVENT:

Titel:       ${event.title}
Datum:       ${event.date ?? "unbekannt"}
Ort:         ${event.location ?? "unbekannt"}
Beschreibung: ${event.rawDescription?.slice(0, 600) ?? "keine"}
URL:         ${event.url}

Antworte NUR mit validem JSON ohne Kommentare oder Markdown:
{
  "relevant": boolean,
  "score": 1|2|3|4|5,
  "category": "Conference|Meetup|Workshop|Hackathon|Networking|Webinar|Other",
  "title_clean": "sauberer, prägnanter Titel auf Deutsch oder Englisch",
  "date_clean": "YYYY-MM-DD oder leerer String wenn unbekannt",
  "location_clean": "Stadt, Land",
  "reason": "Ein konkreter Satz warum dieser Score — mit Bezug auf die Rubrik"
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,      // niedrig = konsistenter
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text().trim();

    // Strip markdown fences if model ignores responseMimeType
    const jsonStr = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(jsonStr) as GeminiScore;

    // Validate and clamp score
    const validScore = clampScore(parsed.score);

    // Consistency check: if score <= 1, force relevant: false
    const relevant = validScore >= 2 ? Boolean(parsed.relevant) : false;

    return {
      ...parsed,
      score: validScore,
      relevant,
    };
  } catch (err) {
    console.error("[gemini] scoring failed:", err);
    return { ...FALLBACK, title_clean: event.title };
  }
}
