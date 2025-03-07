// KANBAN COLUMN
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/_components/KanbanColumn.tsx

'use client'

import React from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { Task } from "./TaskCard"

interface KanbanColumnProps {
  title: string
  status: "pending" | "in_progress" | "completed"
  tasks: Task[]
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: string) => void
  projectId: Id<"projects">
  onAddTask: () => void
  className?: string
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  tasks,
  onDrop,
  projectId,
  onAddTask,
  className,
  children,
}) => {
  // Handle drag over to enable dropping
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault() // This is crucial for the drop event to fire
    e.stopPropagation()
  }

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault() // Prevent default browser behavior
    e.stopPropagation()
    onDrop(e, status) // Pass the event and column status to parent
  }

  // Get custom styles based on status
  const getColumnStyles = () => {
    switch (status) {
      case "pending":
        return "border-blue-200 bg-blue-50/30"
      case "in_progress":
        return "border-amber-200 bg-amber-50/30"
      case "completed":
        return "border-green-200 bg-green-50/30"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div 
      className={`flex flex-col h-full border rounded-lg overflow-hidden ${getColumnStyles()} ${className}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm border-b">
        <div className="flex items-center">
          <h3 className="font-medium">{title}</h3>
          <span className="text-xs px-2 py-1 bg-white rounded-full ml-2 border">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onAddTask}
        >
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Add task</span>
        </Button>
      </div>
      
      <ScrollArea 
        className="flex-1 p-2"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ height: 'calc(100vh - 250px)' }}
      >
        {children}
      </ScrollArea>
    </div>
  )
}

export default KanbanColumn