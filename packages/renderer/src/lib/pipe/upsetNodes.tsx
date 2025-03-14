// UPSET NODES
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/lib/pipe/upsetNodes.tsx

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import md5 from "md5";

/**
 * Cosine similarity function.
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
 * Normalization helper: returns a normalized (unit-length) vector.
 */
function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return norm ? vector.map(val => val / norm) : vector;
}

/**
 * Optimized function to upsert nodes and links with:
 * - Smart batching
 * - AI-generated labels with caching
 * - Prioritized link creation
 */
export async function upsertNodesAndLinks(
  docChunks: any[],
  chunkEmbeddings: { embedding: number[] }[],
  convexUrl: string,
  similarityThreshold = 0.4,  // Adjust this (e.g., 0.2) if necessary.
  topK = 5
): Promise<void> {
  // Create Convex client.
  const convex = new ConvexHttpClient(convexUrl);

  // Step 1: Prepare node data (we use docChunks and the corresponding embedding arrays)
  const nodePrep = docChunks.map((chunk, index) => {
    const meta = chunk.metadata || {};
    const textForLabel = chunk.pageContent || "";
    let textHash: string;
    try {
      textHash = md5(textForLabel.slice(0, 500));
    } catch (error) {
      console.error("Error generating md5 hash; applying fallback:", error);
      // Fallback: encode the text to try to avoid malformed sequences.
      textHash = md5(encodeURI(textForLabel.slice(0, 500)));
    }

    // DEBUG: Log embedding length for each chunk.
    console.log(`Chunk ${chunk.uniqueChunkId}: embedding length =`, chunkEmbeddings[index]?.length || 0);

    return {
      documentChunkId: chunk.uniqueChunkId,
      textHash,
      textForLabel,
      group: determineGroup(meta),
      significance: calculateSignificance(meta),
      // Use the embedding directly since chunkEmbeddings is an array of number[].
      embedding: chunkEmbeddings[index] || []
    };
  });

  // (Optional) Log all node IDs to help verify uniqueness:
  nodePrep.forEach((node) => console.log("Prepared node ID:", node.documentChunkId));

  // Step 2: Check which labels we already have cached.
  const textHashes = nodePrep.map(node => node.textHash);
  const existingLabels = new Map<string, string>();
  for (let i = 0; i < textHashes.length; i += 20) {
    const batchHashes = textHashes.slice(i, i + 20);
    const labelPromises = batchHashes.map(hash =>
      convex.query(api.labelCache.getLabel, { textHash: hash })
    );
    const batchResults = await Promise.all(labelPromises);
    batchHashes.forEach((hash, idx) => {
      if (batchResults[idx]) {
        existingLabels.set(hash, batchResults[idx]);
      }
    });
  }

  // Step 3: Generate missing labels with AI.
  const missingLabelTexts: string[] = [];
  const missingLabelIndices: number[] = [];
  nodePrep.forEach((node, index) => {
    if (!existingLabels.has(node.textHash)) {
      missingLabelTexts.push(node.textForLabel);
      missingLabelIndices.push(index);
    }
  });
  if (missingLabelTexts.length > 0) {
    const generatedLabels: string[] = await convex.action(
      api.aiServices.batchGenerateLabels,
      { texts: missingLabelTexts }
    );
    missingLabelIndices.forEach((nodeIndex, arrayIndex) => {
      const node = nodePrep[nodeIndex];
      const newLabel = generatedLabels[arrayIndex];
      existingLabels.set(node.textHash, newLabel);
      // Cache the new label in the database.
      convex.mutation(api.labelCache.storeLabel, {
        textHash: node.textHash,
        originalText: node.textForLabel.slice(0, 500),
        label: newLabel
      }).catch(err => console.error("Error caching label:", err));
    });
  }

  // Step 4: Prepare final node data with labels (for insertion into the graph table).
  const nodes = nodePrep.map(node => ({
    documentChunkId: node.documentChunkId,
    label: existingLabels.get(node.textHash) || defaultLabel(node.textForLabel),
    group: node.group,
    significance: node.significance
  }));

  // Step 5: Upsert nodes in batches.
  await convex.mutation(api.graph.batchUpsertGraphNodes, { nodes });
  console.log("Upserted nodes:", nodes.length);

  // Step 6: Calculate and upsert links.
  // We use the original nodePrep data to compute pairwise similarities based on embeddings.
  const chunkItems = nodePrep.map(node => ({
    id: node.documentChunkId,
    embedding: node.embedding
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
    const similarities: Array<{ targetId: string; similarity: number; relationship: string }> = [];
    for (let j = 0; j < chunkItems.length; j++) {
      if (i === j) continue;
      const target = chunkItems[j];
      if (!target.embedding.length) continue;
      // Normalize embeddings for a fair cosine similarity comparison.
      const sourceNorm = normalize(source.embedding);
      const targetNorm = normalize(target.embedding);
      const sim = cosineSimilarity(sourceNorm, targetNorm);
      console.log(`Similarity between ${source.id} and ${target.id}:`, sim);
      if (sim >= similarityThreshold) {
        similarities.push({
          targetId: target.id,
          similarity: sim,
          relationship: determineRelationship(sim)
        });
      }
    }
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topMatches = similarities.slice(0, topK);
    topMatches.forEach(match => {
      allLinks.push({
        source: source.id,
        target: match.targetId,
        similarity: match.similarity,
        relationship: match.relationship
      });
    });
  }
  console.log("Total generated links:", allLinks.length);

  // Step 7: Upsert links in batches.
  if (allLinks.length > 0) {
    await convex.mutation(api.graph.batchUpsertGraphLinks, { links: allLinks });
    console.log("Upserted links:", allLinks.length);
  } else {
    console.warn("No links generated - check your embeddings and similarity threshold");
  }
}

// Helper functions.
function determineGroup(meta: any): string {
  if (meta.topics && meta.topics.length > 0) {
    return meta.topics[0];
  } else if (meta.docAuthor && meta.docAuthor !== "Unknown") {
    return meta.docAuthor;
  } else if (meta.docTitle) {
    return "From: " + meta.docTitle.split(" ")[0];
  }
  return "Unknown";
}

function calculateSignificance(meta: any): number {
  let score = 1;
  if (meta.numTokens) {
    score += Math.log10(meta.numTokens + 1);
  }
  if (meta.headings && meta.headings.length > 0) {
    score += 0.5;
  }
  return score;
}

function determineRelationship(similarity: number): string {
  if (similarity > 0.8) return "strong";
  if (similarity > 0.6) return "similar";
  if (similarity > 0.4) return "related";
  return "weak";
}

function defaultLabel(text: string): string {
  return text.slice(0, 40).replace(/\s+/g, " ") + "...";
}