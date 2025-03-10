// TASK FORM V2
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
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, addDays } from "date-fns"
import { CalendarIcon, Clock, BellRing, Repeat, Palette } from "lucide-react"
import { Task } from "./TaskCard"

// Time options for dropdowns (30-minute intervals)
const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const formattedHour = hour.toString().padStart(2, "0");
  return `${formattedHour}:${minute}`;
});

// Function to convert 24-hour format to 12-hour display
const formatTimeDisplay = (time24h: string) => {
  if (!time24h) return "";
  const [hourStr, minuteStr] = time24h.split(":");
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minuteStr} ${period}`;
};

// Color options for task
const COLOR_OPTIONS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gray", value: "#6b7280" },
];

// Reminder options in minutes
const REMINDER_OPTIONS = [
  { label: "None", value: 0 },
  { label: "5 minutes before", value: 5 },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "1 day before", value: 1440 },
];

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTask?: Task | null
  projectId: Id<"projects">
  initialDate?: Date // For creating task from calendar
}

const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onOpenChange,
  editTask,
  projectId,
  initialDate,
}) => {
  const router = useRouter()
  const createTask = useMutation(api.projects.createTask)
  const updateTask = useMutation(api.projects.updateTask)

  // Basic task information
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"pending" | "in_progress" | "completed">("pending")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")

  // Date and time fields
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isAllDay, setIsAllDay] = useState(true)
  const [startTime, setStartTime] = useState<string>("09:00")
  const [endTime, setEndTime] = useState<string>("10:00")

  // Recurrence fields
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly")
  const [recurrenceEnd, setRecurrenceEnd] = useState<Date | undefined>(undefined)

  // Display fields
  const [taskColor, setTaskColor] = useState<string>("#3b82f6") // Default blue
  const [reminder, setReminder] = useState<number>(0) // 0 means no reminder

  // Form tab state
  const [activeTab, setActiveTab] = useState("basic")

  // Update form when editing task or when initialDate is provided
  useEffect(() => {
    if (editTask) {
      // Basic information
      setTitle(editTask.taskTitle || "")
      setDescription(editTask.taskDescription || "")
      setStatus(editTask.taskStatus || "pending")
      setPriority(editTask.taskPriority || "medium")

      // Date and time
      setDueDate(editTask.taskDueDate ? new Date(editTask.taskDueDate) : undefined)
      setIsAllDay(editTask.taskAllDay !== false)
      setStartTime(editTask.taskStartTime || "09:00")
      setEndTime(editTask.taskEndTime || "10:00")

      // Recurrence
      setIsRecurring(!!editTask.taskRecurring)
      setRecurrencePattern(editTask.taskRecurrencePattern || "weekly")
      setRecurrenceEnd(editTask.taskRecurrenceEnd ? new Date(editTask.taskRecurrenceEnd) : undefined)

      // Display
      setTaskColor(editTask.taskColor || "#3b82f6")
      setReminder(editTask.taskReminder || 0)
    } else {
      // Reset form for a new task
      setTitle("")
      setDescription("")
      setStatus("pending")
      setPriority("medium")

      // Initialize with initialDate if provided, otherwise undefined
      setDueDate(initialDate || undefined)
      setIsAllDay(true)
      setStartTime("09:00")
      setEndTime("10:00")

      // Reset recurrence
      setIsRecurring(false)
      setRecurrencePattern("weekly")
      setRecurrenceEnd(undefined)

      // Reset display
      setTaskColor("#3b82f6")
      setReminder(0)
    }
  }, [editTask, initialDate, open])

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
          taskStatus: status,
          taskPriority: priority,
          taskDueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
          taskStartTime: !isAllDay ? startTime : undefined,
          taskEndTime: !isAllDay ? endTime : undefined,
          taskAllDay: isAllDay,
          taskRecurring: isRecurring,
          taskRecurrencePattern: isRecurring ? recurrencePattern : undefined,
          taskRecurrenceEnd: isRecurring && recurrenceEnd ? format(recurrenceEnd, "yyyy-MM-dd") : undefined,
          taskColor: taskColor,
          taskReminder: reminder > 0 ? reminder : undefined,
        })
        toast.success("Task updated successfully")
      } else {
        // Create new task
        await createTask({
          taskTitle: title,
          taskDescription: description,
          taskStatus: status,
          taskPriority: priority,
          taskDueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
          taskStartTime: !isAllDay ? startTime : undefined,
          taskEndTime: !isAllDay ? endTime : undefined,
          taskAllDay: isAllDay,
          taskRecurring: isRecurring,
          taskRecurrencePattern: isRecurring ? recurrencePattern : undefined,
          taskRecurrenceEnd: isRecurring && recurrenceEnd ? format(recurrenceEnd, "yyyy-MM-dd") : undefined,
          taskColor: taskColor,
          taskReminder: reminder > 0 ? reminder : undefined,
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
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTask ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="recurrence">Recurrence</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
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
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      footer={
                        <div className="flex justify-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDueDate(new Date());
                              return false;
                            }}
                          >
                            Today
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDueDate(addDays(new Date(), 1));
                              return false;
                            }}
                          >
                            Tomorrow
                          </Button>
                        </div>
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* All Day switch */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="all-day" className="text-sm font-medium">
                    All Day
                  </label>
                </div>
                <Switch
                  id="all-day"
                  checked={isAllDay}
                  onCheckedChange={setIsAllDay}
                />
              </div>

              {/* Time slots - only show if not all day */}
              {!isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="start-time" className="text-sm font-medium">
                      Start Time
                    </label>
                    <Select
                      value={startTime}
                      onValueChange={setStartTime}
                    >
                      <SelectTrigger id="start-time">
                        <SelectValue placeholder="Start time">
                          {formatTimeDisplay(startTime)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="end-time" className="text-sm font-medium">
                      End Time
                    </label>
                    <Select
                      value={endTime}
                      onValueChange={setEndTime}
                    >
                      <SelectTrigger id="end-time">
                        <SelectValue placeholder="End time">
                          {formatTimeDisplay(endTime)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Recurrence Tab */}
            <TabsContent value="recurrence" className="space-y-4">
              {/* Recurring toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="recurring" className="text-sm font-medium">
                    Recurring Task
                  </label>
                </div>
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              {/* Recurrence options - only show if recurring */}
              {isRecurring && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="recurrence-pattern" className="text-sm font-medium">
                      Repeat
                    </label>
                    <Select
                      value={recurrencePattern}
                      onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") => setRecurrencePattern(value)}
                    >
                      <SelectTrigger id="recurrence-pattern">
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="recurrence-end" className="text-sm font-medium">
                      End Date (Optional)
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {recurrenceEnd ? (
                            format(recurrenceEnd, "PPP")
                          ) : (
                            <span className="text-muted-foreground">No end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={recurrenceEnd}
                          onSelect={setRecurrenceEnd}
                          initialFocus
                          disabled={(date) => dueDate ? date < dueDate : date < new Date()}
                          footer={
                            <div className="p-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRecurrenceEnd(undefined);
                                  return false;
                                }}
                                className="w-full justify-center"
                              >
                                Clear End Date
                              </Button>
                            </div>
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Display Tab */}
            <TabsContent value="display" className="space-y-4">
              {/* Color selection */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">
                    Task Color
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full ${taskColor === color.value ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setTaskColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Reminder field */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <BellRing className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="reminder" className="text-sm font-medium">
                    Reminder
                  </label>
                </div>
                <Select
                  value={reminder.toString()}
                  onValueChange={(value) => setReminder(parseInt(value))}
                >
                  <SelectTrigger id="reminder">
                    <SelectValue placeholder="Set reminder" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 border-t">
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