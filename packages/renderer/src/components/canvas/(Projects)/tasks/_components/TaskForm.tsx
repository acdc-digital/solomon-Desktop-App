// TASK FORM
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/_components/TaskForm.tsx

'use client'

import React, { useEffect, useState } from "react"
import { useMutation } from 'convex/react'
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
// import { Calendar } from "@/components/ui/calendar"
import { Task } from "./TaskCard"

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTask?: Task | null
  projectId: Id<"projects">
}

const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onOpenChange,
  editTask,
  projectId,
}) => {
  const router = useRouter()
  const createTask = useMutation(api.projects.createTask)
  const updateTask = useMutation(api.projects.updateTask)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"pending" | "in_progress" | "completed">("pending")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  // Update form when editing task
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.taskTitle || "")
      setDescription(editTask.taskDescription || "")
      setStatus(editTask.taskStatus || "pending")
      setPriority(editTask.taskPriority || "medium")
      setDueDate(editTask.taskDueDate ? new Date(editTask.taskDueDate) : undefined)
    } else {
      // Reset form for a new task
      setTitle("")
      setDescription("")
      setStatus("pending")
      setPriority("medium")
      setDueDate(undefined)
    }
  }, [editTask, open])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error("Task title is required")
      return
    }

    try {
      if (editTask) {
        // Update existing task
        await updateTask({
          id: editTask._id,
          taskTitle: title,
          taskDescription: description,
          taskStatus: status
        })
        toast.success("Task updated successfully")
      } else {
        // Create new task
        await createTask({
          taskTitle: title,
          taskDescription: description,
          taskStatus: status,
          taskPriority: priority,
          // Format date string if available
          taskDueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
          parentProject: projectId
        })
        toast.success("Task created successfully")
      }
      
      // Reset and close form
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving task:", error)
      toast.error(editTask ? "Failed to update task" : "Failed to create task")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editTask ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title field */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              rows={4}
            />
          </div>

          {/* Status field */}
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select
              value={status}
              onValueChange={(value: "pending" | "in_progress" | "completed") => setStatus(value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority field */}
          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium">
              Priority
            </label>
            <Select
              value={priority}
              onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select a priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date field */}
          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? (
                    format(dueDate, "PPP")
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              {/* <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent> */}
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editTask ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TaskForm