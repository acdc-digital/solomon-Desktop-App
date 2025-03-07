// PROJECT TASKS
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/Tasks.tsx

'use client'

import { useState } from "react"
import { useUser } from "@/hooks/useUser"
import { Id } from "../../../../../convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, PlusCircle } from "lucide-react"
import Image from "next/image"
import KanbanBoard from "./_components/KanbanBoard"
import TaskForm from "./_components/TaskForm"

interface TasksProps {
  projectId: Id<"projects">
}

const Tasks: React.FC<TasksProps> = ({ projectId }) => {
  const { user } = useUser()
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  
  // Get project details
  const project = useQuery(api.projects.getById, { projectId })
  
  // Check if project exists
  if (!project) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading project...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {project.title ? `${project.title} Tasks` : 'Tasks'}
          </h1>
          <Button onClick={() => setTaskFormOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        <Separator className="mb-6" />
        
        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden min-h-[500px]">
          <KanbanBoard projectId={projectId} />
        </div>
        
        {/* Task Form */}
        <TaskForm
          open={taskFormOpen}
          onOpenChange={setTaskFormOpen}
          projectId={projectId}
        />
      </div>
    </div>
  )
}

export default Tasks