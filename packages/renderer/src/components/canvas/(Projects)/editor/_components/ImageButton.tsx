// ImageButton.tsx
// /Users/matthewsimon/Documents/Solomon/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/editor/_components/ImageButton.tsx

import React, { useState } from "react"
import { Editor } from "@tiptap/react"
import { ImageIcon, UploadIcon, Link2Icon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ImageButtonProps {
  editor: Editor
}

export function ImageButton({ editor }: ImageButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  const insertImage = (src: string) => {
    editor.chain().focus().setImage({ src }).run()
  }

  const handleUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const imageUrl = URL.createObjectURL(file)
        insertImage(imageUrl)
      }
    }

    input.click()
  }

  const handleImageUrlSubmit = () => {
    if (imageUrl) {
      insertImage(imageUrl)
      setImageUrl("")
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center 
                       rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
          >
            <ImageIcon className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleUpload}>
            <UploadIcon className="size-4 mr-2" />
            Upload
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <Link2Icon className="size-4 mr-2" />
            Paste Image URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image URL</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Insert URL Image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleImageUrlSubmit()
              }
            }}
          />
          <DialogFooter>
            <Button onClick={handleImageUrlSubmit}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}