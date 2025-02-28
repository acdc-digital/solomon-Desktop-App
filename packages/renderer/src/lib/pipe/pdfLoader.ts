// pdfLoader.ts
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/lib/pipe/pdfLoader.ts

import fetch from "node-fetch";
import { LlamaParseReader, Document } from "llamaindex";
import { NextResponse } from "next/server";
import convex from "@/lib/convexClient";
import { retryWithBackoff } from "./utils";

/**
 * Download the file from a Convex storage URL and convert to a Buffer.
 * Although this function is named downloadPdfToBuffer for testing purposes,
 * it now supports all file types that LlamaParse can handle.
 */
export async function downloadPdfToBuffer(fileId: string): Promise<Buffer> {
  console.log("Invoking Convex mutation: projects:getFileUrl with fileId =", fileId);
  const response = await retryWithBackoff(
    () => convex.mutation("projects:getFileUrl", { fileId }),
    5,
    1000
  );

  if (!response || !response.url) {
    console.error("No URL returned for file");
    throw new Error("No URL returned for file");
  }

  const fileUrl = response.url;
  console.log("File URL:", fileUrl);
  console.log("Fetching the file from the URL");
  const fileResponse = await fetch(fileUrl, { timeout: 120000 });
  if (!fileResponse.ok) {
    console.error("Failed to fetch file:", fileResponse.statusText);
    throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer;
}

/**
 * Loads the file data directly from the Buffer using LlamaParseReader.
 * This function now handles any supported document type, not just PDFs.
 */
export async function loadPdfWithLlamaParseReader(fileBuffer: Buffer): Promise<Document[]> {
  try {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY;
    const reader = new LlamaParseReader({
      apiKey,
      resultType: "json",
      verbose: false,
    });

    // Convert the Buffer to Uint8Array and load with LlamaParseReader
    const uint8Array = new Uint8Array(fileBuffer);
    const jsonResult = await reader.loadJson(uint8Array);

    const documents = jsonResult.map(result => {
      return new Document({
        text: JSON.stringify(result),
        metadata: {}
      });
    });
    console.log("Document parsing completed with LlamaParseReader");
    return documents;
  } catch (error) {
    console.error("Error during LlamaParse processing:", error);
    throw new Error(`Error during LlamaParse processing: ${error}`);
  }
}

/**
 * High-level function to download and load the file with LlamaParse.
 * Function name remains downloadAndLoadPdf for testing, even though it now handles multiple types.
 */
export async function downloadAndLoadPdf(fileId: string): Promise<Document[]> {
  try {
    const fileBuffer = await downloadPdfToBuffer(fileId);
    const documents = await loadPdfWithLlamaParseReader(fileBuffer);
    return documents;
  } catch (error) {
    console.error("Error in downloadAndLoadPdf:", error);
    throw error;
  }
}