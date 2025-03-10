// FileList.tsx
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/components/canvas/(Projects)/_components/FileList.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useEditorStore } from "@/lib/store/editorStore";
import { DocumentData } from "@/types/DocumentData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Check, 
  XCircle, 
  Search, 
  ArrowUpDown, 
  FileText,
  FileIcon,
  Image,
  FileSpreadsheet,
  FilePresentation,
  File
} from "lucide-react";

interface FileListProps {
  projectId: string;
  title?: string;
}

/**
 * Helper function to extract file extension.
 * If the input looks like a MIME type (contains a "/"), we use a mapping.
 * Otherwise, we assume it's a file name and extract the extension using regex.
 */
function extractFileExtension(input: string | undefined): string {
  if (!input) return "Unknown";

  // Check if the input looks like a MIME type.
  if (input.includes("/")) {
    const mimeToExt: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "text/plain": ".txt",
      "text/html": ".html",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/bmp": ".bmp",
      "image/svg+xml": ".svg",
      "image/tiff": ".tiff",
      "image/webp": ".webp",
      // Add more mappings as needed.
    };
    return mimeToExt[input] || input;
  }

  // Otherwise, assume it's a file name and extract the extension.
  const match = input.match(/\.(\w+)$/);
  return match ? match[0].toLowerCase() : "Unknown";
}

export const FileList: React.FC<FileListProps> = ({ projectId, title = "Project Files" }) => {
  const documents = useQuery(api.projects.getDocumentsByProjectId, { projectId });
  const {
    setActiveView,
    setSelectedFile,
    pendingFiles,
    removePendingFile,
    sortOrder,
    setSortOrder,
  } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (documents) {
      const fetchedFileIds = documents.map((doc) => doc.fileId);
      fetchedFileIds.forEach((fileId) => {
        removePendingFile(fileId);
      });
    }
  }, [documents, removePendingFile]);

  const processedDocuments = useMemo(() => {
    if (!documents) return [];

    const docs = documents.map((doc) => {
      // Use the stored metadata to determine the file extension:
      // Prefer contentType if available, otherwise use fileName (or documentTitle as fallback).
      const fileType =
        doc.contentType
          ? extractFileExtension(doc.contentType)
          : extractFileExtension(doc.fileName || doc.documentTitle);

      const createdAt = new Date(doc._creationTime);
      const formattedCreatedAt = createdAt.toLocaleString();
      const processingDuration = Date.now() - createdAt.getTime();
      const isStuck = doc.isProcessing && processingDuration > 10 * 60 * 1000; // 10 minutes

      return {
        ...doc,
        fileType,
        formattedCreatedAt,
        fileId: doc.fileId,
        isStuck,
      };
    });

    // Filter by search query if provided
    const filtered = searchQuery
      ? docs.filter(doc => 
          (doc.documentTitle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.fileType?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : docs;

    return filtered.sort((a, b) => {
      const dateA = new Date(a._creationTime).getTime();
      const dateB = new Date(b._creationTime).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [documents, sortOrder, searchQuery]);

  const handleRowClick = (doc: DocumentData) => {
    setSelectedFile(doc);
    setActiveView("preview");
  };

  const retryProcessing = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch("/api/retry-processing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error("Retry processing failed");
      }
    } catch (error) {
      console.error("Error retrying processing:", error);
      alert("Failed to retry processing. Please try again.");
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        </div>

        <div className="relative mb-4">
          <Input
            placeholder="Search files by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {documents === undefined ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <p className="ml-2 text-gray-500">Loading files...</p>
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-lg border">
            <Table className="table-fixed w-full min-w-full">
              <TableHeader className="bg-gray-50">
                <TableRow className="cursor-default hover:bg-transparent">
                  <TableHead className="w-36 text-left font-semibold">Title</TableHead>
                  <TableHead className="w-24 text-left font-semibold">Type</TableHead>
                  <TableHead className="w-48 text-left font-semibold">Created At</TableHead>
                  <TableHead className="w-56 text-left font-semibold">Progress</TableHead>
                  <TableHead className="w-12 text-left font-semibold">Status</TableHead>
                  <TableHead className="w-12 text-left font-semibold"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingFiles.map((file) => (
                  <TableRow
                    key={`pending-${file.fileId}`}
                    className="group cursor-pointer hover:bg-gray-100 bg-gray-50 animate-pulse"
                  >
                    <TableCell className="py-3 text-sm">
                      <div className="pr-2">
                        <Skeleton className="h-4 w-[180px]" />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-sm">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {processedDocuments.length === 0 && pendingFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No files found
                    </TableCell>
                  </TableRow>
                ) : (
                  processedDocuments.map((doc) => (
                    <TableRow
                      key={doc._id.toString()}
                      onClick={() => handleRowClick(doc)}
                      className={`group cursor-pointer hover:bg-gray-100 ${doc.isProcessing ? "bg-gray-50" : ""}`}
                    >
                      <TableCell className="py-3 text-sm font-medium">
                        <div className="flex items-center">
                          <span className="ml-2">{doc.documentTitle || doc.fileName || "Untitled"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {doc.fileType}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {doc.formattedCreatedAt}
                      </TableCell>
                      <TableCell>
                        {doc.isStuck ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-red-500 text-xs">Processing Stuck</span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => retryProcessing(doc.fileId, e)}
                              className="h-7 text-xs"
                            >
                              Retry
                            </Button>
                          </div>
                        ) : (
                          <Progress
                            className="h-2"
                            value={doc.isProcessed ? 100 : doc.progress || 0}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.isProcessing ? (
                          <Loader2
                            className="animate-spin h-4 w-4 text-gray-500"
                            aria-label="Loading"
                          />
                        ) : doc.isProcessed ? (
                          <Check
                            className="h-4 w-4 text-green-500"
                            aria-label="Completed"
                          />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <XCircle 
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-5 w-5 text-red-500 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add delete functionality here
                            console.log("Delete file", doc._id);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};