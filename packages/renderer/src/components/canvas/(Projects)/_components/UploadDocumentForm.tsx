// UploadDocumentForm
///Users/matthewsimon/Documents/Github/solomon-electron/next/src/components/canvas/(Projects)/_components/UploadDocumentForm.tsx

"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { X, Upload, File as FileIcon } from "lucide-react"
import { Loader2 } from "lucide-react"

export const runtime = "nodejs";

interface UploadDocumentFormProps {
  onUpload: () => void;
  projectId: Id<"projects">;
  parentProject?: Id<"projects">;
}

interface FileWithTitle extends File {
  title?: string;
}

const formSchema = z.object({
  files: z.array(
    z.custom<FileWithTitle>((val) => val instanceof File, {
      message: "Expected a File object",
    })
  ).min(1, "At least one file is required"),
});

export default function UploadDocumentForm({ onUpload, projectId }: UploadDocumentFormProps) {
  const createDocument = useMutation(api.projects.createDocument);
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Convert each File to FileWithTitle and set an initial title based on filename
      const filesWithTitles = acceptedFiles.map(file => {
        const fileWithTitle = file as FileWithTitle;
        // Set initial title as the filename without extension
        fileWithTitle.title = file.name.split('.')[0];
        return fileWithTitle;
      });
      
      form.setValue("files", filesWithTitles, { shouldValidate: true });
    },
    [form]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.tiff', '.webp'],
      'text/*': ['.txt', '.rtf', '.html', '.htm', '.xml'],
      'application/msword': ['.doc', '.docx', '.docm', '.dot', '.dotm'],
      'application/vnd.ms-excel': ['.xls', '.xlsx', '.xlsm', '.xlsb'],
      'application/vnd.ms-powerpoint': ['.ppt', '.pptx', '.pptm', '.pot', '.potm', '.potx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/csv': ['.csv']
      // Add other accept types as needed from your original Input accept attribute
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setUploading(true);
      onUpload();
      
      // Create a copy of the upload progress object with all files at 0%
      const initialProgress: Record<string, number> = {};
      values.files.forEach(file => {
        initialProgress[file.name] = 0;
      });
      setUploadProgress(initialProgress);
      
      // Process each file
      const uploadPromises = values.files.map(async (file, index) => {
        const fileWithTitle = file as FileWithTitle;
        
        // Use the individual file's title or fall back to filename without extension
        const documentTitle = fileWithTitle.title || file.name.split('.')[0];
            
        // Step 1: Generate upload URL
        const url = await generateUploadUrl();
        
        // Step 2: Upload the file to the returned URL with progress tracking
        const result = await uploadFileWithProgress(url, file, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        });
        
        if (!result.ok) {
          throw new Error(`File upload failed for ${file.name}`);
        }
        
        const { storageId } = await result.json();
        
        // Step 3: Create a document entry in the database with file metadata
        const { documentId } = await createDocument({
          documentTitle,
          fileId: storageId as string,
          contentType: file.type,
          fileName: file.name,
          parentProject: projectId,
        });
        
        // Step 4: Call external API for further processing
        await fetch("/api/parse-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId, fileId: storageId })
        });
        
        return { documentId, fileId: storageId, fileName: file.name };
      });
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Reset form after successful upload
      form.reset();
      
    } catch (error) {
      console.error("Upload error:", error);
      // You might want to show an error toast or notification here
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }
  
  // Function to upload file with progress tracking
  async function uploadFileWithProgress(
    url: string, 
    file: File, 
    onProgress: (progress: number) => void
  ) {
    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open("POST", url);
      xhr.setRequestHeader("Content-Type", file.type);
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers({
              'Content-Type': 'application/json'
            })
          });
          resolve(response);
        } else {
          reject(new Error(`HTTP Error: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener("error", () => {
        reject(new Error("Network Error"));
      });
      
      xhr.addEventListener("abort", () => {
        reject(new Error("Upload Aborted"));
      });
      
      xhr.send(file);
    });
  }
  
  // Function to remove a file from the selection
  const removeFile = (fileToRemove: File) => {
    const currentFiles = form.getValues("files");
    const updatedFiles = currentFiles.filter(file => file !== fileToRemove);
    form.setValue("files", updatedFiles, { shouldValidate: true });
  };
  
  // Function to update a file's title
  const updateFileTitle = (fileToUpdate: FileWithTitle, newTitle: string) => {
    const currentFiles = form.getValues("files") as FileWithTitle[];
    const updatedFiles = currentFiles.map(file => {
      if (file === fileToUpdate) {
        file.title = newTitle;
      }
      return file;
    });
    form.setValue("files", updatedFiles);
  };
  
  const files = form.watch("files");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Files</FormLabel>
              <FormControl>
                <div className="flex flex-col space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Upload className="h-10 w-10 text-gray-400" />
                      {isDragActive ? (
                        <p>Drop the files here ...</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Drag & drop files here or click to select</p>
                          <p className="text-xs text-gray-500">
                            Supports PDF, Word, Excel, PowerPoint, images, and more
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* File list with editable titles */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected Files ({files.length})</p>
                      <ul className="border rounded-md divide-y">
                        {files.map((file, index) => {
                          const fileWithTitle = file as FileWithTitle;
                          return (
                            <li key={index} className="p-3">
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <FileIcon className="h-5 w-5 text-blue-500" />
                                    <span className="text-sm truncate max-w-xs">{file.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    {uploading && uploadProgress[file.name] !== undefined && (
                                      <div className="flex items-center space-x-2">
                                        {uploadProgress[file.name] < 100 ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                        ) : (
                                          <div className="h-4 w-4 rounded-full bg-green-500"></div>
                                        )}
                                        <span className="text-xs">{uploadProgress[file.name]}%</span>
                                      </div>
                                    )}
                                    
                                    {!uploading && (
                                      <button
                                        type="button"
                                        onClick={() => removeFile(file)}
                                        className="text-red-500 hover:bg-red-50 rounded-full p-1"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Individual title field for each file */}
                                {!uploading && (
                                  <div className="pl-8">
                                    <Input
                                      type="text"
                                      value={fileWithTitle.title || ''}
                                      onChange={(e) => updateFileTitle(fileWithTitle, e.target.value)}
                                      placeholder="Document title"
                                      className="text-sm h-8"
                                      disabled={uploading}
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                      Enter a title for this document
                                    </div>
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={uploading || files.length === 0}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading ({files.length} {files.length === 1 ? 'file' : 'files'})...
            </>
          ) : (
            `Upload ${files.length} ${files.length === 1 ? 'file' : 'files'}`
          )}
        </Button>
      </form>
    </Form>
  )
}