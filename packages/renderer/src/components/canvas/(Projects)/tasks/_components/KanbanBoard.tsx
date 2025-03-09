// KANBAN BOARD
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/_components/KanbanBoard.tsx

'use client'

import React, { useState } from "react"
import { useQuery, useMutation } from 'convex/react'
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { Loader2, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import KanbanColumn from "./KanbanColumn"
import TaskCard, { Task } from "./TaskCard"
import TaskForm from "./TaskForm"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface KanbanBoardProps {
  projectId: Id<"projects">
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const router = useRouter()
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  // Fetch tasks by status
  const pendingTasks = useQuery(api.projects.getTasksByStatus, { taskStatus: "pending" })
  const inProgressTasks = useQuery(api.projects.getTasksByStatus, { taskStatus: "in_progress" })
  const completedTasks = useQuery(api.projects.getTasksByStatus, { taskStatus: "completed" })
  
  // Filter tasks for this project
  const filteredPendingTasks = pendingTasks?.filter(task => task.parentProject === projectId) || []
  const filteredInProgressTasks = inProgressTasks?.filter(task => task.parentProject === projectId) || []
  const filteredCompletedTasks = completedTasks?.filter(task => task.parentProject === projectId) || []

  // Mutation for updating task status
  const updateTask = useMutation(api.projects.updateTask)

  // Open task form for adding new task
  const handleAddTask = () => {
    setEditingTask(null)
    setTaskFormOpen(true)
  }

  // Open task form for editing task
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskFormOpen(true)
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    // Store the task ID as data to be used on drop
    e.dataTransfer.setData('taskId', task._id.toString())
  }

  // Handle dropping a task in a column
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    // Get task ID from drag data
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return

    try {
      // Map the column name to task status value
      const statusMap: { [key: string]: "pending" | "in_progress" | "completed" } = {
        "pending": "pending",
        "in_progress": "in_progress",
        "completed": "completed"
      }

      // Update the task status
      await updateTask({
        id: taskId as Id<"projects">,
        taskStatus: statusMap[newStatus]
      })

      toast.success(`Task moved to ${newStatus === "pending" ? "To Do" : 
                               newStatus === "in_progress" ? "In Progress" : 
                               "Done"}`)
      router.refresh()
    } catch (error) {
      console.error("Failed to update task status:", error)
      toast.error("Failed to move task")
    }
  }

  // Show loading state if data is still loading
  if (!pendingTasks || !inProgressTasks || !completedTasks) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading tasks...</span>
      </div>
    )
  }

  const hasNoTasks = 
    filteredPendingTasks.length === 0 && 
    filteredInProgressTasks.length === 0 && 
    filteredCompletedTasks.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Empty state */}
      {hasNoTasks && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-gray-500 mb-4">No tasks yet. Create your first task to get started.</p>
          <Button onClick={handleAddTask}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      )}

      {/* Kanban board - ensure full height and proper overflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-0">
        <KanbanColumn
          title="To Do"
          status="pending"
          tasks={filteredPendingTasks}
          onDrop={handleDrop}
          projectId={projectId}
          onAddTask={handleAddTask}
        >
          {filteredPendingTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onDragStart={handleDragStart}
              onEdit={handleEditTask}
            />
          ))}
          {filteredPendingTasks.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No tasks to do
            </div>
          )}
        </KanbanColumn>

        <KanbanColumn
          title="In Progress"
          status="in_progress"
          tasks={filteredInProgressTasks}
          onDrop={handleDrop}
          projectId={projectId}
          onAddTask={handleAddTask}
        >
          {filteredInProgressTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onDragStart={handleDragStart}
              onEdit={handleEditTask}
            />
          ))}
          {filteredInProgressTasks.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No tasks in progress
            </div>
          )}
        </KanbanColumn>

        <KanbanColumn
          title="Done"
          status="completed"
          tasks={filteredCompletedTasks}
          onDrop={handleDrop}
          projectId={projectId}
          onAddTask={handleAddTask}
        >
          {filteredCompletedTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onDragStart={handleDragStart}
              onEdit={handleEditTask}
            />
          ))}
          {filteredCompletedTasks.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No completed tasks
            </div>
          )}
        </KanbanColumn>
      </div>

      {/* Task form dialog */}
      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        editTask={editingTask}
        projectId={projectId}
      />
    </div>
  )
}

export default KanbanBoard