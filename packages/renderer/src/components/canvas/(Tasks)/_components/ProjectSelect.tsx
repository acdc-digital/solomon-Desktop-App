// PROJECT SELECT
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/ProjectSelect.tsx

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { Check, ChevronsUpDown, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ProjectSelectProps {
  value?: Id<"projects"> | null
  onChange: (value: Id<"projects"> | null) => void
}

export function ProjectSelect({ value, onChange }: ProjectSelectProps) {
  const [open, setOpen] = useState(false)
  const projects = useQuery(api.projects.getSidebar, {}) || []

  // Ensure the selected project exists in the list or reset it
  useEffect(() => {
    if (value && projects.length > 0) {
      const exists = projects.some(project => project._id === value)
      if (!exists) {
        onChange(null)
      }
    }
  }, [value, projects, onChange])

  // Find the selected project name
  const selectedProject = projects.find(project => project._id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProject ? (
            <div className="flex items-center">
              <FolderOpen className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              {selectedProject.title}
            </div>
          ) : (
            <div className="flex items-center text-gray-500">
              <FolderOpen className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              Select a project
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandEmpty>No projects found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              key="all-tasks"
              onSelect={() => {
                onChange(null)
                setOpen(false)
              }}
              className="text-sm"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
              All Tasks
            </CommandItem>
            
            {projects.map((project) => (
              <CommandItem
                key={project._id}
                onSelect={() => {
                  onChange(project._id)
                  setOpen(false)
                }}
                className="text-sm"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === project._id ? "opacity-100" : "opacity-0"
                  )}
                />
                {project.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}