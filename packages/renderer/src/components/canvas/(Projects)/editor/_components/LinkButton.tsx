// LinkButton.tsx
// /Users/matthewsimon/Documents/Solomon/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/editor/_components/LinkButton.tsx

import React, { useState } from "react"
import { Editor } from "@tiptap/react"
import { LinkIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * Props for LinkButton:
 * We just need the `editor` to issue commands. 
 */
interface LinkButtonProps {
  editor: Editor
}

export function LinkButton({ editor }: LinkButtonProps) {
  const [value, setValue] = useState(editor?.getAttributes("link").href || "")

  const applyLink = (href: string) => {
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href })
      .run()
    setValue("")
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          // Sync the state with the currently selected link, if any
          const currentLink = editor?.getAttributes("link").href || ""
          setValue(currentLink)
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        {/* 
          Prevent default onMouseDown so the editor doesn't lose focus. 
          Also let the button reflect its state if you want (optional).
        */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center 
                     rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
        >
          <LinkIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        onMouseDown={(e) => e.preventDefault()} // keep focus
        className="p-2.5 flex items-center gap-x-2"
      >
        <Input
          placeholder="https://YourLink.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          onMouseDown={(e) => {
            e.preventDefault()
            applyLink(value)
          }}
        >
          Apply
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}