import type { GeminiScore } from "./ai/gemini";

type Category = GeminiScore["category"];

const RULES: Array<{ pattern: RegExp; category: Category }> = [
  { pattern: /hackathon/i, category: "Hackathon" },
  { pattern: /conference|konferenz|summit|gipfel|symposium/i, category: "Conference" },
  { pattern: /workshop|kurs|training|bootcamp/i, category: "Workshop" },
  { pattern: /networking|stammtisch|after.?work/i, category: "Networking" },
  { pattern: /webinar|online.?(session|talk|event)|livestream/i, category: "Webinar" },
  { pattern: /meetup|treffen|stammtisch|community.?event/i, category: "Meetup" },
];

export function detectCategory(title: string, description?: string): Category {
  const text = `${title} ${description ?? ""}`;
  for (const { pattern, category } of RULES) {
    if (pattern.test(text)) return category;
  }
  return "Other";
}
