// Keywords die ein Event als AI-relevant markieren
const AI_KEYWORDS = [
  // Englisch
  "artificial intelligence", "machine learning", "deep learning", "neural network",
  "large language model", "llm", "generative ai", "gen ai", "computer vision",
  "natural language", "nlp", "data science", "reinforcement learning",
  "transformer", "gpt", "chatgpt", "openai", "gemini", "claude",
  "ai ", " ai ", "a.i.", "ml ", " ml ",
  // Deutsch
  "künstliche intelligenz", "maschinelles lernen", "neuronales netz",
  "sprachmodell", "ki ", " ki ", "k.i.", "datenwissenschaft",
  "algorithmus", "automatisierung", "robotik",
  // Abkürzungen & Themen
  "hackathon", "data", "rag", "vector", "embedding", "prompt",
  "automation", "robotics", "autonomous",
];

export function isAiRelevant(title: string, description?: string): boolean {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  return AI_KEYWORDS.some((kw) => text.includes(kw));
}
