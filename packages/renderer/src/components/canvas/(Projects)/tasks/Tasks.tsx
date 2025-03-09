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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading project...</span>
      </div>
    )
  }

  return (
    // Modified to take full height and use flex properly
    <div className="flex flex-col h-full">
      {/* Header - use flex-shrink-0 to prevent it from shrinking */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {project.title ? `${project.title} Tasks` : 'Tasks'}
          </h1>
          <Button
            onClick={() => setTaskFormOpen(true)}
            className="text-gray-600 border-b border-gray-500 ml-2 mt-0 mb-0 mr-2"
            variant="outline"
            size="sm"
            >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        <Separator />
      </div>

      {/* Kanban Board container - flex-grow with min-h-0 is crucial */}
      <div className="flex-grow min-h-0 px-4 pt-4 pb-4">
        <KanbanBoard projectId={projectId} />
      </div>

      {/* Task Form */}
      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        projectId={projectId}
      />
    </div>
  )
}

export default Tasks