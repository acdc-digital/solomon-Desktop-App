// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/components/canvas/(Projects)/_components/FilePreview.tsx
// src/components/FilePreview.tsx

"use client";

import "../../../../setupPDF"; // Keep your PDF worker config here
import React, { useState, useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store/editorStore";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Document, Page } from "react-pdf";
import {
  ZoomInIcon,
  ZoomOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Button } from "@/components/ui/button";

const FilePreview: React.FC = () => {
  const selectedFile = useEditorStore((state) => state.selectedFile);
  const setActiveView = useEditorStore((state) => state.setActiveView);
  const setSelectedFile = useEditorStore((state) => state.setSelectedFile);

  const [isLoading, setIsLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"pdf" | "image" | "text" | "unsupported">("unsupported");
  const [textContent, setTextContent] = useState<string>("");

  // PDF states
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const getFileUrlMutation = useMutation(api.projects.getFileUrl);

  // Helper: get file extension from file name or URL
  function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts[parts.length - 1].toLowerCase();
  }

  // Determine preview type based on file extension
  function determinePreviewType(fileName: string) {
    const ext = getFileExtension(fileName);
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "tiff", "webp"].includes(ext)) return "image";
    if (["txt", "xml", "html", "htm"].includes(ext)) return "text";
    return "unsupported";
  }

  useEffect(() => {
    if (!selectedFile) return;

    const fetchFileUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getFileUrlMutation({ fileId: selectedFile.fileId });
        setFileUrl(response.url);

        // Determine preview type using the selectedFile.name if available,
        // or fallback to the fileUrl.
        const filename = selectedFile.fileName || response.url;
        const type = determinePreviewType(filename);
        setPreviewType(type);

        // If it's a text file, fetch its content
        if (type === "text") {
          const res = await fetch(response.url);
          const text = await res.text();
          setTextContent(text);
        }
      } catch (err) {
        console.error("Error fetching file URL:", err);
        setError("Failed to load the file.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileUrl();
  }, [selectedFile, getFileUrlMutation]);

  // PDF load success
  function onDocumentLoadSuccess(pdf: { numPages: number }) {
    setNumPages(pdf.numPages);
    setPageNumber(1);
  }

  // Navigation Handlers for PDF
  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  // Zoom Handlers for PDF
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 5));
  };
  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.2));
  };

  const handleBack = () => {
    setActiveView("files");
    setSelectedFile(null);
    setFileUrl(null);
    setIsLoading(true);
    setError(null);
    setPageNumber(1);
    setScale(1.0);
  };

  // Render preview based on file type
  const renderPreview = () => {
    if (previewType === "pdf") {
      if (numPages === 0) return null;
      const pageWidth = 800 * scale;
      return (
        <div style={{ border: '1px solid #ccc', display: 'flex', justifyContent: 'center' }}> 
          <Page
            key={`page_${pageNumber}`}
            pageNumber={pageNumber}
            width={pageWidth}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </div>
      );
    } else if (previewType === "image") {
      return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={fileUrl!} alt="File preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
        </div>
      );
    } else if (previewType === "text") {
      return (
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', overflowY: 'auto', maxHeight: '80vh' }}>
          <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
        </div>
      );
    } else {
      // Unsupported type: provide a download link
      return (
        <div className="text-center">
          <p className="text-gray-700">Preview not available for this file type.</p>
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              Click here to download the file.
            </a>
          )}
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex flex-row items-center bg-gray-100 p-2 space-x-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back to Files
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Zoom controls (only shown for PDFs) */}
        {previewType === "pdf" && (
          <div className="flex flex-row items-center space-x-2">
            <button
              onClick={zoomOut}
              className="bg-gray-200 p-2 hover:bg-gray-300 rounded"
              aria-label="Zoom Out"
            >
              <ZoomOutIcon className="h-4 w-4" />
            </button>
            <span className="text-sm">{(scale * 100).toFixed(0)}%</span>
            <button
              onClick={zoomIn}
              className="bg-gray-200 p-2 hover:bg-gray-300 rounded"
              aria-label="Zoom In"
            >
              <ZoomInIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Page navigation for PDFs */}
        {previewType === "pdf" && (
          <div className="flex flex-row items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="bg-gray-200 p-2 hover:bg-gray-300 rounded"
              aria-label="Previous Page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm">
              Page {pageNumber} of {numPages || 0}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="bg-gray-200 p-2 hover:bg-gray-300 rounded"
              aria-label="Next Page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto bg-gray-200 p-4">
        {isLoading && <p className="text-gray-700">Loading file...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {fileUrl && !error && !isLoading && (
          <div ref={pdfContainerRef} style={{ display: 'flex', justifyContent: 'center' }}>
            {renderPreview()}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreview;