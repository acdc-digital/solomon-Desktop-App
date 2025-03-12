// PROJECT TASKS V2
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/Tasks.tsx

'use client'

import { useState } from "react"
import { useUser } from "@/hooks/useUser"
import { Id } from "../../../../../convex/_generated/dataModel"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { 
  Loader2, 
  PlusCircle, 
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock
} from "lucide-react"
import KanbanBoard from "./_components/KanbanBoard"
import TaskForm from "./_components/TaskForm"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface TasksProps {
  projectId: Id<"projects">
}

const Tasks: React.FC<TasksProps> = ({ projectId }) => {
  const { user } = useUser()
  const router = useRouter()
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  
  // Collapsible state
  const [overdueOpen, setOverdueOpen] = useState(false)
  const [upcomingOpen, setUpcomingOpen] = useState(false)
  
  // Get project details
  const project = useQuery(api.projects.getById, { projectId })
  
  // Get upcoming tasks
  const upcomingTasks = useQuery(api.projects.getUpcomingTasks, { 
    projectId, 
    limit: 10 // Increased limit
  })
  
  // Get overdue tasks
  const overdueTasks = useQuery(api.projects.getOverdueTasks, { 
    projectId 
  })
  
  // Navigate to calendar view
  const handleViewCalendar = () => {
    router.push(`/projects/${projectId}/calendar`)
  }
  
  // Handle editing a task
  const handleEditTask = (task) => {
    setEditingTask(task)
    setTaskFormOpen(true)
  }
  
  // Check if project exists
  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading project...</span>
      </div>
    )
  }

  // Format task due dates
  const formatTaskDueDate = (dueDate?: string, allDay?: boolean, startTime?: string) => {
    if (!dueDate) return "No due date";
    
    const date = new Date(dueDate);
    const isToday = new Date().toDateString() === date.toDateString();
    const formattedDate = isToday ? "Today" : format(date, "MMM d, yyyy");
    
    if (allDay || !startTime) {
      return formattedDate;
    }
    
    // Format time (convert 24h to 12h)
    const [hour, minute] = startTime.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    
    return `${formattedDate}, ${hour12}:${minute} ${ampm}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {project.title ? `${project.title} Tasks` : 'Tasks'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your project tasks
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewCalendar}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
            <Button
              onClick={() => setTaskFormOpen(true)}
              size="sm"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
        
        {/* Task Summary Section - Using dropdowns instead of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pt-0 pb-4">
          {/* Overdue Tasks Dropdown */}
          <Collapsible 
            open={overdueOpen} 
            onOpenChange={setOverdueOpen}
            className="border rounded-md overflow-hidden"
          >
            <CollapsibleTrigger className="flex items-center justify-between p-3 w-full bg-white hover:bg-gray-50">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="font-medium">Overdue Tasks</span>
              </div>
              <div className="flex items-center">
                <Badge variant="destructive">
                  {overdueTasks ? overdueTasks.length : 0}
                </Badge>
                <div className="ml-2">
                  {overdueOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y">
                {overdueTasks && overdueTasks.length > 0 ? (
                  overdueTasks.map(task => (
                    <div 
                      key={task._id.toString()} 
                      className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEditTask(task)}
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.taskColor || (
                            task.taskPriority === "high" ? "#ef4444" : 
                            task.taskPriority === "medium" ? "#f59e0b" : "#10b981"
                          )}}
                        />
                        <span className="truncate">{task.taskTitle}</span>
                      </div>
                      <span className="text-xs text-red-600 whitespace-nowrap flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTaskDueDate(task.taskDueDate, task.taskAllDay, task.taskStartTime)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-sm text-gray-500">
                    No overdue tasks
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          {/* Upcoming Tasks Dropdown */}
          <Collapsible 
            open={upcomingOpen} 
            onOpenChange={setUpcomingOpen}
            className="border rounded-md overflow-hidden"
          >
            <CollapsibleTrigger className="flex items-center justify-between p-3 w-full bg-white hover:bg-gray-50">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-blue-500 mr-2" />
                <span className="font-medium">Upcoming Tasks</span>
              </div>
              <div className="flex items-center">
                <Badge variant="outline">
                  {upcomingTasks ? upcomingTasks.length : 0}
                </Badge>
                <div className="ml-2">
                  {upcomingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y">
                {upcomingTasks && upcomingTasks.length > 0 ? (
                  upcomingTasks.map(task => (
                    <div 
                      key={task._id.toString()} 
                      className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEditTask(task)}
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.taskColor || (
                            task.taskPriority === "high" ? "#ef4444" : 
                            task.taskPriority === "medium" ? "#f59e0b" : "#10b981"
                          )}}
                        />
                        <span className="truncate">{task.taskTitle}</span>
                      </div>
                      <span className="text-xs text-gray-600 whitespace-nowrap flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTaskDueDate(task.taskDueDate, task.taskAllDay, task.taskStartTime)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-sm text-gray-500">
                    No upcoming tasks
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <Separator />
      </div>

      {/* Kanban Board container */}
      <div className="flex-grow h-[calc(100%-1px)] overflow-hidden">
        <div className="h-full px-4 pt-4 pb-4">
          <KanbanBoard projectId={projectId} />
        </div>
      </div>

      {/* Task Form */}
      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        editTask={editingTask}
        projectId={projectId}
      />
    </div>
  )
}

export default Tasks