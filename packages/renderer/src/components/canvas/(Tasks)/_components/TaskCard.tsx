// TASK CARD
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/TaskCard.tsx   

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Doc, Id } from '../../../../../convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DragHandleDots2Icon } from '@radix-ui/react-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Check, 
  Clock, 
  CalendarIcon, 
  Trash2, 
  AlertCircle, 
  PenSquare
} from 'lucide-react'

interface TaskCardProps {
  task: Doc<"projects"> & { type: "task" }
  columnId: string
}

export function TaskCard({ task, columnId }: TaskCardProps) {
  const router = useRouter()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [title, setTitle] = useState(task.taskTitle || '')
  const [description, setDescription] = useState(task.taskDescription || '')
  const [status, setStatus] = useState(task.taskStatus || 'pending')

  const updateTask = useMutation(api.projects.updateTask)
  const deleteTask = useMutation(api.projects.archive)

  const handleUpdate = async () => {
    try {
      await updateTask({
        id: task._id,
        taskTitle: title,
        taskDescription: description,
        taskStatus: status as "pending" | "in_progress" | "completed"
      })
      toast.success('Task updated')
      setShowEditDialog(false)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update task')
      console.error(error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTask({ id: task._id })
      toast.success('Task archived')
      setShowEditDialog(false)
      router.refresh()
    } catch (error) {
      toast.error('Failed to archive task')
      console.error(error)
    }
  }

  const getPriorityColor = () => {
    switch (task.taskPriority) {
      case 'high':
        return 'bg-red-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-black'
      case 'low':
        return 'bg-green-500 text-white'
      default:
        return 'bg-slate-500 text-white'
    }
  }

  return (
    <>
      <Card className="mb-3 cursor-pointer hover:shadow-md transition-all duration-200 group">
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
          <div className="flex-1 flex items-start">
            <DragHandleDots2Icon className="h-5 w-5 text-gray-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium line-clamp-1">{task.taskTitle}</span>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowEditDialog(true)
                  }} 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <PenSquare className="h-4 w-4" />
                </Button>
              </div>
              <Badge className={cn("text-xs", getPriorityColor())}>
                {task.taskPriority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <p className="text-sm text-gray-600 line-clamp-2">{task.taskDescription}</p>
        </CardContent>
        <CardFooter className="p-3 pt-0 text-xs text-gray-500 flex justify-between">
          {task.taskDueDate && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{new Date(task.taskDueDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="ml-auto flex items-center">
            {task.taskStatus === 'completed' && <Check className="h-3 w-3 text-green-500" />}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to your task here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" onClick={handleUpdate}>
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}