// MetaData Extractor!
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/lib/pipe/metadataExtractors.ts

/**
 * A simple keyword extractor using frequency counts.
 */
export function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\W+/);
  const freq: Record<string, number> = {};
  for (const word of words) {
    if (word.length >= 4) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);
}

/**
 * A naive entity extractor using regex for capitalized word sequences.
 */
export function extractEntities(text: string): string[] {
  const entityRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+))\b/g;
  const matches = text.match(entityRegex) || [];
  return Array.from(new Set(matches));
}

/**
 * A simple topic classifier based on keyword matching.
 */
export function assignTopics(text: string): string[] {
  const topics: string[] = [];
  if (text.match(/\b(market|finance|stock)\b/i)) {
    topics.push("Finance");
  }
  if (text.match(/\b(ml|machine learning|ai|artificial intelligence)\b/i)) {
    topics.push("AI");
  }
  if (text.match(/\b(law|legal|court|act)\b/i)) {
    topics.push("Legal");
  }
  return topics;
}