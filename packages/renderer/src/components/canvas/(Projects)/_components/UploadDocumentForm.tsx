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

export const runtime = "nodejs";

interface UploadDocumentFormProps {
  onUpload: () => void;
  projectId: Id<"projects">;
  parentProject?: Id<"projects">;
}

const formSchema = z.object({
  title: z.string().min(1).max(250),
  file: z.instanceof(File),
});

export default function UploadDocumentForm({ onUpload, projectId }: UploadDocumentFormProps) {
  const createDocument = useMutation(api.projects.createDocument);
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    onUpload();
    
    // Step 1: Generate upload URL
    const url = await generateUploadUrl();

    // Step 2: Upload the file to the returned URL
    const result = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": values.file.type },
      body: values.file,
    });
    if (!result.ok) {
      throw new Error("File upload failed");
    }

    const { storageId } = await result.json();

    // Step 3: Create a document entry in the database with file metadata
    const { documentId } = await createDocument({
      documentTitle: values.title,
      fileId: storageId as string,
      contentType: values.file.type,   // Capturing MIME type
      fileName: values.file.name,        // Capturing original file name
      parentProject: projectId,
    });

    // Optionally, call your external backend API with documentId & fileId for further processing.
    await fetch("/api/parse-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, fileId: storageId })
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Document name." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({
            field: { onChange, value: _value, ...fieldProps }
          }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                <Input
                  {...fieldProps}
                  type="file"
                  accept=".pdf, .abw, .cgm, .cwk, .doc, .docx, .docm, .dot, .dotm, .hwp, .key, .lwp, .mw, .mcw, .pages, .pbd, .ppt, .pptm, .pptx, .pot, .potm, .potx, .rtf, .sda, .sdd, .sdp, .sdw, .sgl, .sti, .sxi, .sxw, .stw, .sxg, .txt, .uof, .uop, .uot, .vor, .wpd, .wps, .xml, .zabw, .epub, .jpg, .jpeg, .png, .gif, .bmp, .svg, .tiff, .webp, .web, .htm, .html, .xlsx, .xls, .xlsm, .xlsb, .xlw, .csv, .dif, .sylk, .slk, .prn, .numbers, .et, .ods, .fods, .uos1, .uos2, .dbf, .wk1, .wk2, .wk3, .wk4, .wks, .123, .wq1, .wq2, .wb1, .wb2, .wb3, .qpw, .xlr, .eth, .tsv"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    onChange(file);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}