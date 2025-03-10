// RAG API Route
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/app/api/parse-pdf/route.ts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";
import { get_encoding } from "tiktoken";
import { v4 as uuidv4 } from "uuid";
import pLimit from "p-limit";

import { downloadAndLoadPdf } from "@/lib/pipe/pdfLoader";
import { runOcrOnPage, convertPdfPageToImage } from "@/lib/pipe/ocr";

import {
  hierarchicalSemanticSplit,
  getAdaptiveChunkParams,
  extractHeadingsFromText,
} from "@/lib/pipe/chunking";

import {
  extractKeywords,
  extractEntities,
  assignTopics,
} from "@/lib/pipe/metadataExtractors";

import {
  generateEmbeddingsForChunks,
  updateEmbeddingsInDB,
} from "@/lib/pipe/embeddings";

import {
  getFileUrl,
  updateProcessingStatus,
  getParentProjectId,
  insertChunks,
  updateChunkEmbedding,
} from "@/lib/pipe/dbOps";

import { retryWithBackoff } from "@/lib/pipe/utils";

import { upsertNodesAndLinks } from "@/lib/pipe/upsetNodes";

// Helper to fallback-parse the first page for lines like "Author:" or "Title:"
function detectAuthorAndTitleFromFirstPage(text: string): {
  detectedAuthor?: string;
  detectedTitle?: string;
} {
  let detectedAuthor: string | undefined;
  let detectedTitle: string | undefined;
  const authorMatch = text.match(/^Author:\s*(.+)$/im);
  if (authorMatch && authorMatch[1]) {
    detectedAuthor = authorMatch[1].trim();
  }
  const titleMatch = text.match(/^Title:\s*(.+)$/im);
  if (titleMatch && titleMatch[1]) {
    detectedTitle = titleMatch[1].trim();
  }
  return { detectedAuthor, detectedTitle };
}

export async function POST(request: Request) {
  let tempFilePath: string | null = null;

  try {
    // 1) Parse Incoming JSON
    const tokenizer = get_encoding("cl100k_base");
    const { documentId, fileId } = await request.json();
    console.log("Received parse-pdf POST request:", { documentId, fileId });

    if (!documentId || !fileId) {
      return NextResponse.json(
        { error: "Missing documentId or fileId" },
        { status: 400 }
      );
    }

    // 2) Download PDF & Load with LlamaParse
    console.log("Downloading and parsing PDF with LlamaParse");
    const docs = await downloadAndLoadPdf(fileId);
    if (!docs.length) {
      throw new Error("No content extracted from the document (empty docs).");
    }
    console.log("PDF parsing complete");
    const extractedText = docs.map((d) => d.text).join("\n");
    console.log("Sample of extracted text:", extractedText.slice(0, 200), "...");

    // Mark progress ~30%
    await updateProcessingStatus(documentId, { progress: 30 });

    // 3) Hierarchical + Semantic Chunking
    console.log("Splitting the document into sub-chunks...");
    const totalChars = docs.reduce((acc, doc) => acc + doc.text.length, 0);
    const { chunkSize, chunkOverlap } = getAdaptiveChunkParams(totalChars);
    console.log(`Adaptive chunking => chunkSize=${chunkSize}, chunkOverlap=${chunkOverlap}`);

    const allChunks: {
      pageContent: string;
      metadata: {
        pageNumber?: number;
        docTitle?: string;
        docAuthor?: string;
        headings?: string[];
        snippet?: string;
        numTokens?: number;
        // Additional chunk-level metadata:
        keywords?: string[];
        entities?: string[];
        topics?: string[];
        isHeading?: boolean;
      };
    }[] = [];

    // Process each document sequentially
    for (const [docIndex, doc] of docs.entries()) {
      try {
        const docContent = JSON.parse(doc.text);

        // Attempt to retrieve doc-level metadata
        let docAuthor = docContent.metadata?.document_author ?? "Unknown";
        let docTitle = docContent.metadata?.document_title ?? "Untitled";

        // Fallback: parse first page if metadata is missing
        if (
          (docAuthor === "Unknown" || docTitle === "Untitled") &&
          Array.isArray(docContent.pages) &&
          docContent.pages.length > 0
        ) {
          const firstPageText = docContent.pages[0].text || "";
          const { detectedAuthor, detectedTitle } = detectAuthorAndTitleFromFirstPage(firstPageText);
          if (detectedAuthor && docAuthor === "Unknown") {
            docAuthor = detectedAuthor;
          }
          if (detectedTitle && docTitle === "Untitled") {
            docTitle = detectedTitle;
          }
        }

        const fallbackDocLevelPageNumber = docContent.metadata?.page_number ?? docIndex + 1;

        if (docContent?.pages) {
          // Process each page with async/await for proper OCR fallback
          for (const [pageIndex, page] of docContent.pages.entries()) {
            let rawText = page?.text || "";
            const realPageNumber = typeof page.page === "number" ? page.page : pageIndex + 1;

            // If extracted text is insufficient, trigger OCR fallback
            if (!rawText.trim() || rawText.trim().length < 50) {
              console.log(`Page ${realPageNumber} has insufficient text. Initiating OCR fallback.`);
              try {
                const pageImage = await convertPdfPageToImage(page);
                rawText = await runOcrOnPage(pageImage);
              } catch (ocrError) {
                console.error(`OCR failed for page ${realPageNumber}:`, ocrError);
              }
            }

            // Hierarchical and semantic chunking
            const pageChunks = hierarchicalSemanticSplit(rawText, chunkSize, chunkOverlap);
            for (const chunkObj of pageChunks) {
              const chunkText = chunkObj.pageContent;
              const chunkMeta = chunkObj.metadata || {};

              // Optional snippet extraction from chunk text
              const snippetMatch = chunkText.match(/Snippet:\s*(.*)\n/);
              const snippet = snippetMatch ? snippetMatch[1].trim() : "";
              const headings = extractHeadingsFromText(chunkText);

              // Tokenize to count tokens
              let tokens: number[] = [];
              try {
                const encodedTokens = tokenizer.encode(chunkText);
                tokens = Array.from(encodedTokens);
              } catch (err) {
                console.error("Error tokenizing chunk:", err);
              }

              // Merge doc-level, page-level, and chunk-level metadata
              allChunks.push({
                pageContent: chunkText,
                metadata: {
                  docAuthor,
                  docTitle,
                  pageNumber: realPageNumber,
                  snippet,
                  headings,
                  numTokens: tokens.length,
                  ...chunkMeta,
                },
              });
            }
          }
        } else {
          console.warn("route.ts: no pages property found on docContent", docContent);
        }
      } catch (e) {
        console.error("Error parsing document in route.ts for docIndex", docIndex, e);
      }
    }

    console.log("Total number of sub-chunks across all pages:", allChunks.length);
    await updateProcessingStatus(documentId, { progress: 50 });

    // 4) Retrieve Parent Project ID
    console.log("Retrieving parentProjectId for document:", documentId);
    const parentProjectId = await getParentProjectId(documentId);
    if (!parentProjectId) {
      throw new Error(`No parentProjectId found for documentId ${documentId}`);
    }

    // 5) Insert Chunks in Batches
    const docChunks = allChunks.map((chunk, index) => ({
      pageContent: chunk.pageContent,
      uniqueChunkId: uuidv4(),
      chunkNumber: index + 1,
      metadata: { ...chunk.metadata },
    }));

    const BATCH_SIZE = 250;
    const limit = pLimit(1);
    const chunkBatches = [];
    for (let i = 0; i < docChunks.length; i += BATCH_SIZE) {
      chunkBatches.push(docChunks.slice(i, i + BATCH_SIZE));
    }
    console.log(`Total chunk insertion batches: ${chunkBatches.length}`);

    await Promise.all(
      chunkBatches.map((batch) =>
        limit(() =>
          insertChunks(parentProjectId, batch).catch((err) => {
            console.error("Error inserting chunk batch:", err);
          })
        )
      )
    );
    await updateProcessingStatus(documentId, { progress: 60 });

    // 6) Generate Embeddings
    console.log("Generating embeddings for docChunks...");
    const openAIApiKey = process.env.OPENAI_API_KEY || "";
    const chunkEmbeddings = await generateEmbeddingsForChunks(
      docChunks,
      openAIApiKey,
      "text-embedding-3-small"
    );
    console.log("Total embeddings generated:", chunkEmbeddings.length);
    await updateProcessingStatus(documentId, { progress: 90 });

    // 7) Update Embeddings in DB
    await updateEmbeddingsInDB(docChunks, chunkEmbeddings, 1, 250, 5, 1000);

    // 8) upsertNodes to graphTable
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
    await upsertNodesAndLinks(docChunks, chunkEmbeddings, convexUrl);

    // Mark final progress as complete
    await updateProcessingStatus(documentId, {
      progress: 100,
      isProcessed: true,
      isProcessing: false,
      processedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: "PDF parsing complete",
        totalChunks: docChunks.length,
        totalEmbeddings: chunkEmbeddings.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error parsing PDF:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}