'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { TaskColumn } from './TaskColumn'
import { TaskCard } from './TaskCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LayoutGrid, 
  ListTodo, 
  Loader2 
} from 'lucide-react'

interface TaskBoardViewProps {
  projectId: Id<"projects"> | null
}

export function TaskBoardView({ projectId }: TaskBoardViewProps) {
  const [viewType, setViewType] = useState<'kanban' | 'list'>('kanban')
  
  // Query tasks by status
  const pendingTasks = useQuery(api.projects.getTasksByStatus, { taskStatus: "pending" }) || []
  const inProgressTasks = useQuery(api.projects.getTasksByStatus, { taskStatus: "in_progress" }) || []
  const completedTasks = useQuery(api.projects.getTasksByStatus, { taskStatus: "completed" }) || []
  
  // Filter tasks by project if a project is selected
  const filteredPendingTasks = projectId 
    ? pendingTasks.filter(task => task.parentProject === projectId)
    : pendingTasks
  
  const filteredInProgressTasks = projectId
    ? inProgressTasks.filter(task => task.parentProject === projectId)
    : inProgressTasks
  
  const filteredCompletedTasks = projectId
    ? completedTasks.filter(task => task.parentProject === projectId)
    : completedTasks

  // Loading state
  const isLoading = typeof pendingTasks === 'undefined' || 
                   typeof inProgressTasks === 'undefined' || 
                   typeof completedTasks === 'undefined'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="kanban" className="w-full" onValueChange={(v) => setViewType(v as 'kanban' | 'list')}>
      <div className="flex justify-end mb-4">
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center gap-1">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-1">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="kanban" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskColumn 
            title="To Do" 
            status="pending" 
            tasks={filteredPendingTasks}
            count={filteredPendingTasks.length}
            projectId={projectId}
          />
          <TaskColumn 
            title="In Progress" 
            status="in_progress" 
            tasks={filteredInProgressTasks}
            count={filteredInProgressTasks.length}
            projectId={projectId}
          />
          <TaskColumn 
            title="Completed" 
            status="completed" 
            tasks={filteredCompletedTasks}
            count={filteredCompletedTasks.length}
            projectId={projectId}
          />
        </div>
      </TabsContent>

      <TabsContent value="list" className="mt-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              To Do ({filteredPendingTasks.length})
            </h3>
            <div className="space-y-2">
              {filteredPendingTasks.map(task => (
                <TaskCard 
                  key={task._id} 
                  task={task} 
                  columnId="pending" 
                />
              ))}
              {filteredPendingTasks.length === 0 && (
                <p className="text-sm text-gray-500 italic py-2">No tasks yet</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
              In Progress ({filteredInProgressTasks.length})
            </h3>
            <div className="space-y-2">
              {filteredInProgressTasks.map(task => (
                <TaskCard 
                  key={task._id} 
                  task={task} 
                  columnId="in_progress" 
                />
              ))}
              {filteredInProgressTasks.length === 0 && (
                <p className="text-sm text-gray-500 italic py-2">No tasks in progress</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              Completed ({filteredCompletedTasks.length})
            </h3>
            <div className="space-y-2">
              {filteredCompletedTasks.map(task => (
                <TaskCard 
                  key={task._id} 
                  task={task} 
                  columnId="completed" 
                />
              ))}
              {filteredCompletedTasks.length === 0 && (
                <p className="text-sm text-gray-500 italic py-2">No completed tasks</p>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}