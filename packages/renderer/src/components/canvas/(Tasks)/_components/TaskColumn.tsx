// TASK COLUMN 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/TaskColumn.tsx

'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TaskCard } from './TaskCard'
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Task {
  _id: Id<"projects">
  type: "task"
  taskTitle?: string
  taskDescription?: string
  taskStatus?: "pending" | "in_progress" | "completed"
  taskPriority?: "low" | "medium" | "high"
  taskDueDate?: string
  userId: Id<"users">
  isArchived: boolean
  parentProject: Id<"projects"> | null
}

interface TaskColumnProps {
  title: string
  tasks: Task[]
  status: "pending" | "in_progress" | "completed"
  count: number
  projectId?: Id<"projects"> | null
}

export function TaskColumn({ 
  title, 
  tasks, 
  status, 
  count,
  projectId 
}: TaskColumnProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium")

  const createTask = useMutation(api.projects.createTask)

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('Task title is required')
      return
    }

    try {
      await createTask({
        taskTitle: newTaskTitle,
        taskDescription: newTaskDescription,
        taskStatus: status,
        taskPriority: newTaskPriority,
        parentProject: projectId || undefined
      })
      
      toast.success('Task created')
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskPriority('medium')
      setShowAddDialog(false)
    } catch (error) {
      toast.error('Failed to create task')
      console.error(error)
    }
  }

  const getColumnStyle = () => {
    switch (status) {
      case 'pending':
        return 'border-l-blue-500'
      case 'in_progress':
        return 'border-l-yellow-500'
      case 'completed':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-300'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className={cn("h-full border-l-4", getColumnStyle())}>
      <CardHeader className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className={cn("rounded-full px-2 py-0.5 text-xs", getStatusColor())}>
              {count}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowAddDialog(true)}
            className="h-8 w-8"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">Add task</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} columnId={status} />
          ))}
        </div>
      </CardContent>
      
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task in the {title} column.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="newTitle" className="text-sm font-medium">Title</label>
              <Input
                id="newTitle"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="newDescription" className="text-sm font-medium">Description</label>
              <Textarea
                id="newDescription"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Task description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="priority" className="text-sm font-medium">Priority</label>
              <Select
                value={newTaskPriority}
                onValueChange={(value) => setNewTaskPriority(value as "low" | "medium" | "high")}
              >
                <SelectTrigger>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateTask}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}