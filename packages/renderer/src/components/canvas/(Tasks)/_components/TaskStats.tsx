'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  Clock,
  ListTodo,
  RotateCcw
} from 'lucide-react'

interface TaskStatsProps {
  projectId: Id<"projects"> | null
}

export function TaskStats({ projectId }: TaskStatsProps) {
  const pendingTasks = useQuery(api.projects.getTasksByStatus, { taskStatus: "pending" }) || []
  const inProgressTasks = useQuery(api.projects.getTasksByStatus, { taskStatus: "in_progress" }) || []
  const completedTasks = useQuery(api.projects.getTasksByStatus, { taskStatus: "completed" }) || []
  
  // Filter by project if specified
  const filteredPendingTasks = projectId 
    ? pendingTasks.filter(task => task.parentProject === projectId)
    : pendingTasks
  
  const filteredInProgressTasks = projectId
    ? inProgressTasks.filter(task => task.parentProject === projectId)
    : inProgressTasks
  
  const filteredCompletedTasks = projectId
    ? completedTasks.filter(task => task.parentProject === projectId)
    : completedTasks

  // Calculate totals and percentages
  const totalTasks = filteredPendingTasks.length + filteredInProgressTasks.length + filteredCompletedTasks.length
  const completionPercentage = totalTasks > 0 
    ? Math.round((filteredCompletedTasks.length / totalTasks) * 100) 
    : 0
  
  // Loading state
  const isLoading = typeof pendingTasks === 'undefined' || 
                   typeof inProgressTasks === 'undefined' || 
                   typeof completedTasks === 'undefined'

  if (isLoading) {
    return <TaskStatsSkeletons />
  }

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
          <p className="text-xs text-muted-foreground">
            {projectId ? 'In this project' : 'Across all projects'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">To Do</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filteredPendingTasks.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round((filteredPendingTasks.length / totalTasks) * 100) || 0}% of total tasks
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <RotateCcw className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filteredInProgressTasks.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round((filteredInProgressTasks.length / totalTasks) * 100) || 0}% of total tasks
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionPercentage}%</div>
          <Progress
            value={completionPercentage}
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {filteredCompletedTasks.length} of {totalTasks} tasks complete
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function TaskStatsSkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}