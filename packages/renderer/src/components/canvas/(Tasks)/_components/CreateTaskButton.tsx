// CREATE TASK
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/CreateTaskButton.tsx

'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CreateTaskButtonProps {
  projectId: Id<"projects">;
}

export const CreateTaskButton: React.FC<CreateTaskButtonProps> = ({ projectId }) => {
  const createTask = useMutation(api.projects.createTask)
  const [showDialog, setShowDialog] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskStatus, setTaskStatus] = useState<"pending" | "in_progress" | "completed">("pending")
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium")

  const handleSubmit = async () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required')
      return
    }

    try {
      await createTask({
        taskTitle,
        taskDescription,
        taskStatus,
        taskPriority,
        parentProject: projectId,
      })

      toast.success('Task created successfully')

      setTaskTitle('')
      setTaskDescription('')
      setTaskStatus('pending')
      setTaskPriority('medium')
      setShowDialog(false)
    } catch (error) {
      toast.error('Failed to create task')
      console.error(error)
    }
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="h-10">
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Task
        </Button>
      </DialogTrigger>

      <DialogContent>
      <DialogTitle>Create New Task</DialogTitle>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Title</label>
            <Input 
              value={taskTitle} 
              onChange={(e) => setTaskTitle(e.target.value)} 
              placeholder="Enter task title" 
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={taskStatus} onValueChange={(value) => setTaskStatus(value as any)}>
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

            <div className="grid gap-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={taskPriority}
                onValueChange={(value) => setTaskPriority(value as any)}
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
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}