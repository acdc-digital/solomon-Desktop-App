// TASK CARD V2
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/_components/TaskCard.tsx

'use client'

import React, { useRef, useState } from "react"
import { useMutation } from 'convex/react'
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Edit, Trash2, Bell, Repeat, AlertCircle } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface Task {
  _id: Id<"projects">
  taskTitle?: string
  taskDescription?: string
  taskStatus?: "pending" | "in_progress" | "completed"
  taskPriority?: "low" | "medium" | "high"
  taskDueDate?: string
  // New calendar-related fields
  taskStartTime?: string
  taskEndTime?: string
  taskAllDay?: boolean
  taskRecurring?: boolean
  taskRecurrencePattern?: "daily" | "weekly" | "monthly" | "yearly"
  taskRecurrenceEnd?: string
  taskColor?: string
  taskReminder?: number
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
  compact?: boolean // For compact view in calendar
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDragStart,
  onEdit,
  onDelete,
  compact = false
}) => {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  // Get task color - either custom color or default based on priority
  const getTaskColorStyle = () => {
    if (task.taskColor) {
      // Use custom color with opacity for background
      const color = task.taskColor;
      return {
        borderLeft: `4px solid ${color}`,
        backgroundColor: `${color}10` // Add slight transparency
      };
    }
    
    // Fallback to priority-based styling
    switch (task.taskPriority) {
      case "high":
        return { borderLeft: "4px solid #ef4444" };
      case "medium":
        return { borderLeft: "4px solid #f59e0b" };
      case "low":
        return { borderLeft: "4px solid #10b981" };
      default:
        return { borderLeft: "4px solid #3b82f6" };
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      
      // If date is today, show "Today"
      if (isSameDay(date, new Date())) {
        return "Today";
      }
      
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return dateString;
    }
  }

  // Format time for display
  const formatTimeDisplay = (time24h?: string) => {
    if (!time24h) return "";
    
    const [hourStr, minuteStr] = time24h.split(":");
    const hour = parseInt(hourStr, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minuteStr} ${period}`;
  };

  // Get recurrence pattern text
  const getRecurrenceText = () => {
    if (!task.taskRecurring) return null;
    
    switch (task.taskRecurrencePattern) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Yearly";
      default:
        return "Recurring";
    }
  };

  const handleEditTask = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await archiveTask({
        id: task._id
      });
      setShowDeleteDialog(false);
      toast.success('Task archived');
      router.refresh();
    } catch (error) {
      console.error('Failed to archive task:', error);
      toast.error('Failed to archive task');
    }
  };

  // Handle drag start event
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, task);
    
    // Store the element reference directly
    const element = cardRef.current;
    if (element) {
      element.style.opacity = "0.5";
    }
  };

  // Handle drag end event
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset opacity after drag
    const element = cardRef.current;
    if (element) {
      element.style.opacity = "1";
    }
  };

  // Compact mode is used for calendar views
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="py-1 px-2 rounded text-xs cursor-pointer truncate"
              style={getTaskColorStyle()}
              onClick={handleEditTask}
            >
              {task.taskTitle}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{task.taskTitle}</p>
              {task.taskDescription && (
                <p className="text-xs opacity-80">{task.taskDescription}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {task.taskStatus === "pending" ? "To Do" : 
                   task.taskStatus === "in_progress" ? "In Progress" : 
                   "Done"}
                </Badge>
                {task.taskPriority && (
                  <Badge className={`text-xs ${getPriorityColor(task.taskPriority)}`}>
                    {task.taskPriority}
                  </Badge>
                )}
                {task.taskRecurring && (
                  <Badge variant="outline" className="text-xs">
                    <Repeat className="h-3 w-3 mr-1" />
                    {getRecurrenceText()}
                  </Badge>
                )}
              </div>
              {!task.taskAllDay && task.taskStartTime && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeDisplay(task.taskStartTime)}
                  {task.taskEndTime && ` - ${formatTimeDisplay(task.taskEndTime)}`}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <Card 
        ref={cardRef}
        className="mb-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow duration-200" 
        style={getTaskColorStyle()}
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
          
          <div className="flex flex-col gap-1 my-2">
            {/* Due date */}
            {task.taskDueDate && (
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  {formatDate(task.taskDueDate)}
                  {!task.taskAllDay && task.taskStartTime && (
                    <span>, {formatTimeDisplay(task.taskStartTime)}</span>
                  )}
                  {!task.taskAllDay && task.taskStartTime && task.taskEndTime && (
                    <span> - {formatTimeDisplay(task.taskEndTime)}</span>
                  )}
                </span>
              </div>
            )}
            
            {/* Recurrence pattern */}
            {task.taskRecurring && (
              <div className="flex items-center text-xs text-gray-500">
                <Repeat className="h-3 w-3 mr-1" />
                <span>
                  {getRecurrenceText()}
                  {task.taskRecurrenceEnd && (
                    <span> until {formatDate(task.taskRecurrenceEnd)}</span>
                  )}
                </span>
              </div>
            )}
            
            {/* Reminder */}
            {task.taskReminder && task.taskReminder > 0 && (
              <div className="flex items-center text-xs text-gray-500">
                <Bell className="h-3 w-3 mr-1" />
                <span>
                  {task.taskReminder >= 1440 
                    ? `${Math.floor(task.taskReminder / 1440)} day before` 
                    : task.taskReminder >= 60 
                      ? `${Math.floor(task.taskReminder / 60)} hour${task.taskReminder >= 120 ? 's' : ''} before`
                      : `${task.taskReminder} min before`
                  }
                </span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              {/* Render a visual indicator for status */}
              <Badge 
                variant="outline" 
                className={
                  task.taskStatus === "completed" 
                    ? "bg-green-50 text-green-700 border-green-200"
                    : task.taskStatus === "in_progress"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                }
              >
                {task.taskStatus === "pending" ? "To Do" : 
                 task.taskStatus === "in_progress" ? "In Progress" : 
                 "Done"}
              </Badge>
            </div>
            
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleEditTask}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive this task? 
              This will remove it from the current view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Archive Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TaskCard