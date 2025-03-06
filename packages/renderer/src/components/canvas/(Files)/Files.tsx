// Files Dashbaord
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/components/canvas/(Admin)/Admin.tsx

'use client'

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Check, 
  XCircle, 
  Search,
  ArrowUpDown,
  FileText
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useEditorStore } from "@/lib/store/editorStore";

/**
 * Helper function to extract file extension from content type or filename
 */
function extractFileExtension(input: string | undefined): string {
  if (!input) return "Unknown";

  // Check if the input looks like a MIME type
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
    };
    return mimeToExt[input] || input;
  }

  // Otherwise, assume it's a file name and extract the extension
  const match = input.match(/\.(\w+)$/);
  return match ? match[0].toLowerCase() : "Unknown";
}

const Files = () => {
  const { user } = useUser();
  const allDocuments = useQuery(api.projects.getDocuments);
  const { setActiveView, setSelectedFile } = useEditorStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Process and filter documents
  const processedDocuments = useMemo(() => {
    if (!allDocuments) return [];

    // First process all documents to extract needed info
    const docs = allDocuments
      .filter(doc => doc.type === "document") // Only include documents, not projects
      .map(doc => {
        const fileType = extractFileExtension(doc.contentType || doc.fileName || doc.documentTitle);
        const createdAt = new Date(doc._creationTime);
        const formattedCreatedAt = createdAt.toLocaleString();
        const processingDuration = Date.now() - createdAt.getTime();
        const isStuck = doc.isProcessing && processingDuration > 10 * 60 * 1000; // 10 minutes

        return {
          ...doc,
          fileType,
          formattedCreatedAt,
          isStuck,
        };
      });

    // Then filter by search query if provided
    const filtered = searchQuery
      ? docs.filter(doc => 
          (doc.documentTitle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.fileType?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : docs;

    // Finally sort by creation time
    return filtered.sort((a, b) => {
      const dateA = new Date(a._creationTime).getTime();
      const dateB = new Date(b._creationTime).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [allDocuments, searchQuery, sortOrder]);

  const handleRowClick = (doc: any) => {
    setSelectedFile(doc);
    setActiveView("preview");
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
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

  return (
    <div className="flex flex-col h-screen overflow-y-auto pb-10">
      <div className="flex flex-col gap-y-4 border rounded-lg bg-white shadow-sm mx-6 my-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center">
            <FileText className="mr-2 h-6 w-6" />
            Files Library
          </h1>
          <Button 
            variant="outline" 
            onClick={toggleSortOrder}
            className="flex items-center gap-x-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "desc" ? "Newest First" : "Oldest First"}
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {allDocuments === undefined ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
                {processedDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
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
                        {doc.documentTitle || doc.fileName || "Untitled"}
                      </TableCell>
                      <TableCell className="text-sm">
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

export default Files;