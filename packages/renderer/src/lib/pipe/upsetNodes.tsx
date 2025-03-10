import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

/** 
 * Example cosine similarity function 
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  return denominator ? dot / denominator : 0;
}

/**
 * This function takes docChunks + chunkEmbeddings, 
 * and writes a corresponding graph of nodes/links to Convex's "graph" table.
 * 
 * We'll enhance the logic for label, group, significance, and link relationship.
 */
export async function upsertNodesAndLinks(
  docChunks: any[],
  chunkEmbeddings: { embedding: number[] }[],
  convexUrl: string,
  similarityThreshold = 0.4,  // Lower threshold = more edges
  topK = 5                   // Up to 5 neighbors per node
): Promise<void> {
  // 1) Create the Convex client for server-side usage
  const convex = new ConvexHttpClient(convexUrl);

  // 2) Upsert Graph Nodes
  const nodes = docChunks.map((chunk, index) => {
    const meta = chunk.metadata || {};

    // Dynamic label: prefer docTitle, else the first heading, else snippet, else fallback
    let label = meta.docTitle;
    if (!label || label === "Untitled") {
      if (meta.headings && meta.headings.length > 0) {
        label = meta.headings[0];
      } else if (meta.snippet) {
        label = meta.snippet.slice(0, 60);
      } else {
        // Fallback to first ~60 chars of text
        label = chunk.pageContent.slice(0, 60).replace(/\s+/g, " ");
      }
    }

    // Dynamic group: prefer topics[0], else docAuthor, else fallback
    let group = "Unknown";
    if (meta.topics && meta.topics.length > 0) {
      group = meta.topics[0];
    } else if (meta.docAuthor && meta.docAuthor !== "Unknown") {
      group = meta.docAuthor;
    }

    // Dynamic significance: maybe use the number of tokens or an “importance” field if you have it
    const significance = meta.numTokens
      ? Math.max(1, Math.log10(meta.numTokens + 1)) // e.g. scale up by log(# tokens)
      : 1;

    return {
      documentChunkId: chunk.uniqueChunkId,
      label,
      group,
      // any numeric measure, e.g. token-based
      significance,
    };
  });

  await convex.mutation(api.graph.batchUpsertGraphNodes, {
    nodes,
  });

  // 3) Upsert Graph Links
  // Build an array to handle (chunkId, embedding, maybe some metadata)
  const chunkItems = docChunks.map((chunk, i) => ({
    id: chunk.uniqueChunkId,
    embedding: chunkEmbeddings[i]?.embedding || [],
    metadata: chunk.metadata || {}
  }));

  const allLinks: Array<{
    source: string;
    target: string;
    similarity: number;
    relationship: string;
  }> = [];

  for (let i = 0; i < chunkItems.length; i++) {
    const source = chunkItems[i];
    if (!source.embedding.length) continue;

    // Calculate similarity to all other embeddings
    const scores: { targetId: string; similarity: number }[] = [];
    for (let j = 0; j < chunkItems.length; j++) {
      if (i === j) continue;
      const target = chunkItems[j];
      if (!target.embedding.length) continue;

      const sim = cosineSimilarity(source.embedding, target.embedding);
      if (sim >= similarityThreshold) {
        scores.push({ targetId: target.id, similarity: sim });
      }
    }

    // Sort descending by similarity & take topK
    scores.sort((a, b) => b.similarity - a.similarity);
    const topMatches = scores.slice(0, topK);

    topMatches.forEach(match => {
      // If you have a more advanced logic for "relationship," do it here
      // e.g. "sameAuthor," "sameTopic," etc. For now, "similar."
      allLinks.push({
        source: source.id,
        target: match.targetId,
        similarity: match.similarity,
        relationship: "similar"
      });
    });
  }

  // Insert all links
  if (allLinks.length > 0) {
    await convex.mutation(api.graph.batchUpsertGraphLinks, {
      links: allLinks
    });
  }
}