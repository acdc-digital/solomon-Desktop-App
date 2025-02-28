// src/lib/pipe/embeddings.ts
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/lib/pipe/embeddings.ts

import { OpenAIEmbeddings } from "@langchain/openai";
import pLimit from "p-limit";
import { retryWithBackoff } from "./utils";
import convex from "@/lib/convexClient";

/**
 * Interface representing a document chunk for embedding.
 */
export interface DocChunk {
  pageContent: string;
  uniqueChunkId: string;
  metadata?: {
    keywords?: string[];
    entities?: string[];
    topics?: string[];
  };
}

/**
 * Generates embeddings for an array of document chunks.
 */
export async function generateEmbeddingsForChunks(
  docChunks: DocChunk[],
  openAIApiKey: string,
  modelName: string = "text-embedding-3-small",
  retries: number = 5,
  initialDelay: number = 1000
): Promise<number[][]> {
  const texts = docChunks.map((chunk) => {
    const { pageContent, metadata } = chunk;
    let metaStr = "";
    if (metadata?.keywords?.length) {
      metaStr += `\nKeywords: ${metadata.keywords.join(", ")}`;
    }
    if (metadata?.entities?.length) {
      metaStr += `\nEntities: ${metadata.entities.join(", ")}`;
    }
    if (metadata?.topics?.length) {
      metaStr += `\nTopics: ${metadata.topics.join(", ")}`;
    }
    return pageContent + metaStr;
  });

  const openAIEmbeddings = new OpenAIEmbeddings({
    openAIApiKey,
    modelName,
  });

  const embeddings = await retryWithBackoff(
    () => openAIEmbeddings.embedDocuments(texts),
    retries,
    initialDelay
  );

  return embeddings;
}

/**
 * Updates chunk embeddings in the database in batches.
 */
export async function updateEmbeddingsInDB(
  docChunks: DocChunk[],
  chunkEmbeddings: number[][],
  concurrencyLimit: number = 2,
  batchSize: number = 250,
  retries: number = 5,
  initialDelay: number = 1000
): Promise<void> {
  if (docChunks.length !== chunkEmbeddings.length) {
    throw new Error(
      `Mismatch: docChunks has length ${docChunks.length}, but chunkEmbeddings has length ${chunkEmbeddings.length}`
    );
  }

  const total = chunkEmbeddings.length;
  const embeddingBatches = [];
  for (let start = 0; start < total; start += batchSize) {
    const end = Math.min(start + batchSize, total);
    const batchEmbeddings = chunkEmbeddings.slice(start, end);
    const batchChunks = docChunks.slice(start, end);
    embeddingBatches.push({ batchEmbeddings, batchChunks });
  }

  console.log(`Total embedding batches: ${embeddingBatches.length}`);
  const limit = pLimit(concurrencyLimit);

  async function updateOneBatch(
    batchEmbeddings: number[][],
    batchChunks: DocChunk[]
  ) {
    const updates = batchEmbeddings.map((embedding, idx) => {
      const { uniqueChunkId } = batchChunks[idx];
      return retryWithBackoff(
        () =>
          convex.mutation("chunks:updateChunkEmbedding", {
            uniqueChunkId,
            embedding,
          }),
        retries,
        initialDelay
      );
    });
    await Promise.all(updates);
    console.log(`Successfully updated a batch of ${batchEmbeddings.length} embeddings.`);
  }

  await Promise.all(
    embeddingBatches.map(({ batchEmbeddings, batchChunks }, i) =>
      limit(() =>
        updateOneBatch(batchEmbeddings, batchChunks).catch((err) => {
          console.error(`Error updating embedding batch ${i + 1}:`, err);
        })
      )
    )
  );
  console.log("All chunk embeddings updated successfully.");
}