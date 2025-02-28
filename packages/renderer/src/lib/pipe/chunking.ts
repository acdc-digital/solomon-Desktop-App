// src/lib/pipe/chunking.ts
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/lib/pipe/chunking.ts
// -------------------------------------------------------------------------------------

import { isHeading, splitTextByRegex } from "./utils";
import { extractKeywords, extractEntities, assignTopics } from "./metadataExtractors";

/**
 * Represents chunk-level metadata.
 */
export interface ChunkMetadata {
  isHeading?: boolean;
  headings?: string[];
  keywords?: string[];
  entities?: string[];
  topics?: string[];
}

/**
 * Each chunk contains text and its associated metadata.
 */
export interface Chunk {
  pageContent: string;
  metadata: ChunkMetadata;
}

/**
 * Splits text by markdown-style headings.
 */
export function splitByHeadings(text: string): string[] {
  if (!text) {
    console.warn("splitByHeadings: No text provided");
    return [];
  }
  try {
    const headingRegex = /^(#+\s.*)$/gm;
    const parts = splitTextByRegex(text, headingRegex);
    return parts;
  } catch (e) {
    console.error("Error in splitByHeadings", e);
    return [];
  }
}

/**
 * Merges small parts to avoid too many tiny chunks.
 */
function mergeSmallParts(parts: string[], minSize: number): string[] {
  const merged: string[] = [];
  let buffer = "";
  for (const part of parts) {
    if (!buffer) {
      buffer = part;
    } else if ((buffer + part).length < minSize) {
      buffer += "\n" + part;
    } else {
      merged.push(buffer);
      buffer = part;
    }
  }
  if (buffer) {
    merged.push(buffer);
  }
  return merged;
}

/**
 * Splits text into overlapping chunks.
 */
function chunkBySizeWithOverlap(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const segment = text.slice(start, end);
    chunks.push(segment);
    start += (chunkSize - chunkOverlap);
  }
  return chunks;
}

/**
 * Helper to create a chunk object with metadata.
 */
function createChunk(text: string, isHeadingChunk: boolean): Chunk {
  const keywords = extractKeywords(text);
  const entities = extractEntities(text);
  const topics = assignTopics(text);
  return {
    pageContent: text,
    metadata: {
      isHeading: isHeadingChunk,
      keywords,
      entities,
      topics,
    },
  };
}

/**
 * Performs hierarchical semantic splitting.
 */
export function hierarchicalSemanticSplit(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): Chunk[] {
  if (!text) {
    console.warn("hierarchicalSemanticSplit: No text provided");
    return [];
  }
  const chunks: Chunk[] = [];
  try {
    // Split by headings first
    const rawParts = splitByHeadings(text);
    // Merge small sections to avoid fragmentation
    const mergedParts = mergeSmallParts(rawParts, 500);
    for (const part of mergedParts) {
      const trimmedPart = part.trim();
      // If the part is a heading (or similar), handle separately
      if (isHeading(trimmedPart)) {
        chunks.push(createChunk(trimmedPart, true));
        continue;
      }
      if (trimmedPart.length <= chunkSize) {
        chunks.push(createChunk(trimmedPart, false));
      } else {
        const largeChunks = chunkBySizeWithOverlap(trimmedPart, chunkSize, chunkOverlap);
        for (const lc of largeChunks) {
          chunks.push(createChunk(lc, false));
        }
      }
    }
  } catch (e) {
    console.error("Error in hierarchicalSemanticSplit", e);
  }
  return chunks;
}

/**
 * Extracts headings from a block of text.
 */
export function extractHeadingsFromText(text: string): string[] {
  if (!text) return [];
  const lines = text.split('\n');
  return lines.filter(line => {
    const trimmed = line.trim();
    return /^[A-Z\s]+$/.test(trimmed) || /^Section\s+\d+:/.test(trimmed);
  });
}

/**
 * Determines adaptive chunking parameters based on total characters.
 */
export function getAdaptiveChunkParams(totalChars: number): {
  chunkSize: number;
  chunkOverlap: number;
} {
  if (totalChars < 1000) {
    return { chunkSize: 700, chunkOverlap: 100 };
  } else if (totalChars < 5000) {
    return { chunkSize: 1500, chunkOverlap: 200 };
  } else if (totalChars < 10000) {
    return { chunkSize: 2500, chunkOverlap: 300 };
  } else if (totalChars < 50000) {
    return { chunkSize: 3000, chunkOverlap: 300 };
  } else {
    return { chunkSize: 4000, chunkOverlap: 400 };
  }
}