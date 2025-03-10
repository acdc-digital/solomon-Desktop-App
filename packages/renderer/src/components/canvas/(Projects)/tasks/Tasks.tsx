// PROJECT TASKS V2
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/Tasks.tsx

'use client'

import { useState } from "react"
import { useUser } from "@/hooks/useUser"
import { Id } from "../../../../../convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { 
  Loader2, 
  PlusCircle, 
  Filter, 
  Calendar as CalendarIcon,
  List,
  ChevronLeft
} from "lucide-react"
import KanbanBoard from "./_components/KanbanBoard"
import TaskForm from "./_components/TaskForm"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface TasksProps {
  projectId: Id<"projects">
}

const Tasks: React.FC<TasksProps> = ({ projectId }) => {
  const { user } = useUser()
  const router = useRouter()
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  
  // Get project details
  const project = useQuery(api.projects.getById, { projectId })
  
  // Get upcoming tasks count
  const upcomingTasks = useQuery(api.projects.getUpcomingTasks, { 
    projectId, 
    limit: 3 
  })
  
  // Get overdue tasks count
  const overdueTasks = useQuery(api.projects.getOverdueTasks, { 
    projectId 
  })
  
  // Navigate to calendar view
  const handleViewCalendar = () => {
    router.push(`/projects/${projectId}/calendar`)
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
    // Modified to take full height and use flex properly
    <div className="flex flex-col h-full">
      {/* Header - use flex-shrink-0 to prevent it from shrinking */}
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
        
        {/* Summary Cards Section */}
        {(upcomingTasks || overdueTasks) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 pt-0">
            {/* Overdue Tasks Card */}
            <Card className={overdueTasks && overdueTasks.length > 0 ? "border-red-200" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Badge variant="destructive" className="mr-2">
                    {overdueTasks ? overdueTasks.length : 0}
                  </Badge>
                  Overdue Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {overdueTasks && overdueTasks.length > 0 ? (
                  <div className="space-y-2">
                    {overdueTasks.slice(0, 2).map(task => (
                      <div 
                        key={task._id.toString()} 
                        className="flex items-center justify-between p-2 rounded bg-red-50 cursor-pointer hover:bg-red-100"
                        onClick={() => {
                          // Open task form with this task
                          // Implementation depends on how you're handling edit
                        }}
                      >
                        <span className="truncate">{task.taskTitle}</span>
                        <span className="text-xs text-red-600 whitespace-nowrap">
                          {formatTaskDueDate(task.taskDueDate, task.taskAllDay, task.taskStartTime)}
                        </span>
                      </div>
                    ))}
                    {overdueTasks.length > 2 && (
                      <Button variant="link" size="sm" className="p-0 h-auto w-full justify-start text-xs">
                        View all {overdueTasks.length} overdue tasks
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">
                    No overdue tasks
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Upcoming Tasks Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {upcomingTasks && upcomingTasks.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingTasks.map(task => (
                      <div 
                        key={task._id.toString()} 
                        className="flex items-center justify-between p-2 rounded bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          // Open task form with this task
                        }}
                      >
                        <span className="truncate">{task.taskTitle}</span>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {formatTaskDueDate(task.taskDueDate, task.taskAllDay, task.taskStartTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">
                    No upcoming tasks
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Tips Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Task Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>📅 Set due dates to keep on track</p>
                <p>🔄 Create recurring tasks for regular work</p>
                <p>🎨 Use colors to categorize tasks</p>
                <p>⏰ Set reminders for important deadlines</p>
              </CardContent>
            </Card>
          </div>
        )}
        
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