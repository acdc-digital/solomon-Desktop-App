// TASK CARD
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/_components/TaskCard.tsx

'use client'

import React, { useRef } from "react"
import { useMutation } from 'convex/react'
import { api } from "../../../../../../convex/_generated/api"
import { Doc, Id } from "../../../../../../convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface Task {
  _id: Id<"projects">
  taskTitle?: string
  taskDescription?: string
  taskStatus?: "pending" | "in_progress" | "completed"
  taskPriority?: "low" | "medium" | "high"
  taskDueDate?: string
  parentProject: Id<"projects"> | null
  type: "task"
  userId: Id<"users">
  isArchived: boolean
}

interface TaskCardProps {
  task: Task
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: Id<"projects">) => void
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDragStart,
  onEdit,
  onDelete,
}) => {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [title, setTitle] = useState(task.taskTitle || '')
  const [description, setDescription] = useState(task.taskDescription || '')
  const [status, setStatus] = useState<"pending" | "in_progress" | "completed">(
    task.taskStatus || 'pending'
  )
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    task.taskPriority || 'medium'
  )

  const updateTask = useMutation(api.projects.updateTask)
  const archiveTask = useMutation(api.projects.archive)

  // Get priority badge color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      console.error("Invalid date format:", dateString)
      return dateString
    }
  }

  const handleUpdateTask = async () => {
    try {
      await updateTask({
        id: task._id,
        taskTitle: title,
        taskDescription: description,
        taskStatus: status
      })
      setShowEditDialog(false)
      toast.success('Task updated')
      router.refresh()
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleArchiveTask = async () => {
    try {
      await archiveTask({
        id: task._id
      })
      setShowEditDialog(false)
      toast.success('Task archived')
      router.refresh()
    } catch (error) {
      console.error('Failed to archive task:', error)
      toast.error('Failed to archive task')
    }
  }

  // Handle drag start event
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, task)
    
    // Store the element reference directly
    const element = cardRef.current
    if (element) {
      // Apply opacity change directly - no setTimeout needed
      element.style.opacity = "0.5"
    }
  }

  // Handle drag end event
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset opacity after drag
    const element = cardRef.current
    if (element) {
      element.style.opacity = "1"
    }
  }

  return (
    <>
      <Card 
        ref={cardRef}
        className="mb-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow duration-200" 
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-sm">{task.taskTitle}</h4>
            <Badge className={getPriorityColor(task.taskPriority)}>
              {task.taskPriority}
            </Badge>
          </div>
          
          {task.taskDescription && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
              {task.taskDescription}
            </p>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              {task.taskDueDate && (
                <div className="flex items-center text-xs text-gray-500 mr-2">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(task.taskDueDate)}
                </div>
              )}
            </div>
            
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600"
                onClick={() => handleArchiveTask()}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to your task here
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <label htmlFor="task-title" className="text-sm font-medium">Title</label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="task-description" className="text-sm font-medium">Description</label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this task"
                rows={4}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="task-status" className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(value: "pending" | "in_progress" | "completed") => setStatus(value)}
              >
                <SelectTrigger id="task-status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="task-priority" className="text-sm font-medium">Priority</label>
              <Select
                value={priority}
                onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}
              >
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleArchiveTask}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Archive
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleUpdateTask}>
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TaskCard