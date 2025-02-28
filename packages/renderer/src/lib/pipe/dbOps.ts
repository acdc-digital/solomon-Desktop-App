// dbOps.ts
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/lib/pipe/dbOps.ts

import convexClient from "@/lib/convexClient";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Fetches a signed file URL from Convex storage.
 */
export async function getFileUrl(fileId: Id<"_storage">) {
  return await convexClient.mutation("projects:getFileUrl", { fileId });
}

/**
 * Updates the processing status for a given document.
 */
export async function updateProcessingStatus(
  documentId: Id<"projects">,
  { progress, isProcessing, isProcessed, processedAt }: {
    progress?: number;
    isProcessing?: boolean;
    isProcessed?: boolean;
    processedAt?: string;
  }
) {
  return await convexClient.mutation("projects:updateProcessingStatus", {
    documentId,
    progress,
    isProcessing,
    isProcessed,
    processedAt,
  });
}

/**
 * Retrieves the parentProjectId for a document.
 */
export async function getParentProjectId(documentId: Id<"projects">) {
  return await convexClient.query("projects:getParentProjectId", { documentId });
}

/**
 * Inserts multiple chunks into the database.
 */
export async function insertChunks(
  parentProjectId: Id<"projects">,
  chunks: {
    pageContent: string;
    chunkNumber?: number;
    uniqueChunkId: string;
    metadata: {
      pageNumber?: number;
      docTitle?: string;
      docAuthor?: string;
      headings?: string[];
      numTokens?: number;
      snippet?: string;
      keywords?: string[];
      entities?: string[];
      topics?: string[];
    };
  }[]
) {
  return await convexClient.mutation("chunks:insertChunks", {
    parentProjectId,
    chunks,
  });
}

/**
 * Updates a single chunk's embedding in the database.
 */
export async function updateChunkEmbedding(
  uniqueChunkId: string,
  embedding: number[]
) {
  return await convexClient.mutation("chunks:updateChunkEmbedding", {
    uniqueChunkId,
    embedding,
  });
}