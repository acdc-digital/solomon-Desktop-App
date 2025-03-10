// KANBAN COLUMN V2
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/tasks/_components/KanbanColumn.tsx

'use client'

import React, { useState } from "react"
import { PlusCircle, CalendarRange, Clock, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { Task } from "./TaskCard"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isToday, isTomorrow, isAfter } from "date-fns"

interface KanbanColumnProps {
  title: string
  status: "pending" | "in_progress" | "completed"
  tasks: Task[]
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: string) => void
  projectId: Id<"projects">
  onAddTask: () => void
  className?: string
  children: React.ReactNode
}

// Helper function to group tasks by due date
const groupTasksByDueDate = (tasks: Task[]) => {
  return tasks.reduce((groups, task) => {
    if (!task.taskDueDate) {
      if (!groups.noDueDate) {
        groups.noDueDate = [];
      }
      groups.noDueDate.push(task);
      return groups;
    }
    
    const dueDate = new Date(task.taskDueDate);
    
    // Group by relative date (today, tomorrow, future, overdue)
    let groupKey;
    if (isToday(dueDate)) {
      groupKey = 'today';
    } else if (isTomorrow(dueDate)) {
      groupKey = 'tomorrow';
    } else if (isAfter(dueDate, new Date())) {
      groupKey = 'future';
    } else {
      groupKey = 'overdue';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(task);
    return groups;
  }, {} as Record<string, Task[]>);
};

type SortOption = 'priority' | 'dueDate' | 'title';

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  tasks,
  onDrop,
  projectId,
  onAddTask,
  className,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [groupByDate, setGroupByDate] = useState(false);

  // Handle drag over to enable dropping
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // This is crucial for the drop event to fire
    e.stopPropagation();
  }

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent default browser behavior
    e.stopPropagation();
    onDrop(e, status); // Pass the event and column status to parent
  }

  // Get custom styles based on status
  const getColumnStyles = () => {
    switch (status) {
      case "pending":
        return "border-gray-200 bg-gray-50/30";
      case "in_progress":
        return "border-gray-200 bg-gray-50/30";
      case "completed":
        return "border-gray-200 bg-gray-50/30";
      default:
        return "border-gray-200 bg-gray-50";
    }
  }

  // Sort tasks based on selected sort option
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityValues = { high: 3, medium: 2, low: 1 };
          const aPriority = a.taskPriority ? priorityValues[a.taskPriority] || 0 : 0;
          const bPriority = b.taskPriority ? priorityValues[b.taskPriority] || 0 : 0;
          return bPriority - aPriority; // High to low
        }
        case 'dueDate': {
          if (!a.taskDueDate && !b.taskDueDate) return 0;
          if (!a.taskDueDate) return 1; // No due date goes last
          if (!b.taskDueDate) return -1;
          return new Date(a.taskDueDate).getTime() - new Date(b.taskDueDate).getTime();
        }
        case 'title': {
          const aTitle = a.taskTitle || '';
          const bTitle = b.taskTitle || '';
          return aTitle.localeCompare(bTitle);
        }
        default:
          return 0;
      }
    });
  };

  // Get task groups if grouping is enabled
  const getTaskContent = () => {
    if (!groupByDate) {
      return children;
    }
    
    const groups = groupTasksByDueDate(tasks);
    const groupOrder = ['overdue', 'today', 'tomorrow', 'future', 'noDueDate'];
    
    return (
      <div className="space-y-4">
        {groupOrder.map(groupKey => {
          if (!groups[groupKey] || groups[groupKey].length === 0) return null;
          
          // Get readable group title
          let groupTitle;
          switch (groupKey) {
            case 'overdue':
              groupTitle = 'Overdue';
              break;
            case 'today':
              groupTitle = 'Today';
              break;
            case 'tomorrow':
              groupTitle = 'Tomorrow';
              break;
            case 'future':
              groupTitle = 'Upcoming';
              break;
            case 'noDueDate':
              groupTitle = 'No Due Date';
              break;
            default:
              groupTitle = groupKey;
          }
          
          // Sort tasks within group
          const sortedGroupTasks = sortTasks(groups[groupKey]);
          
          return (
            <Collapsible key={groupKey} defaultOpen={true} className="border rounded-md bg-white/50">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-medium">
                <div className="flex items-center">
                  {groupKey === 'overdue' ? (
                    <Clock className="h-3.5 w-3.5 mr-1 text-red-500" />
                  ) : (
                    <CalendarRange className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  )}
                  <span className={groupKey === 'overdue' ? 'text-red-600' : ''}>
                    {groupTitle} ({sortedGroupTasks.length})
                  </span>
                </div>
                <ChevronUp className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-2 pb-2">
                <div className="space-y-2">
                  {/* We need to render task cards manually here since we're handling our own grouping */}
                  {sortedGroupTasks.map(task => {
                    // Find the corresponding child element that matches this task
                    const taskElement = React.Children.toArray(children).find(
                      (child) => {
                        if (React.isValidElement(child)) {
                          return child.props.task?._id === task._id;
                        }
                        return false;
                      }
                    );
                    
                    return taskElement;
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className={`flex flex-col h-full border rounded-lg ${getColumnStyles()} ${className || ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header section */}
      <div className="flex-shrink-0 flex flex-col bg-white/60 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center">
            <h3 className="font-medium">{title}</h3>
            <span className="text-xs px-2 py-1 bg-white rounded-full ml-2 border">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <PlusCircle className="h-4 w-4" />
                  <span className="sr-only">Add task</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddTask}>
                  Add Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
        
        {/* Column controls - only visible when not collapsed */}
        {!collapsed && (
          <div className="px-3 pb-2 flex items-center justify-between text-xs border-t pt-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Sort:</span>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-xs font-medium">
                  {sortBy === 'priority' ? 'Priority' : 
                   sortBy === 'dueDate' ? 'Due Date' : 
                   'Title'}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setSortBy('priority')}>
                    Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('dueDate')}>
                    Due Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('title')}>
                    Title
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Group:</span>
              <Button 
                variant={groupByDate ? "default" : "outline"}
                size="sm" 
                className="h-6 text-xs px-2"
                onClick={() => setGroupByDate(!groupByDate)}
              >
                By Date
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Content section - only visible when not collapsed */}
      {!collapsed ? (
        <div className="flex-grow overflow-hidden">
          <ScrollArea
            className="h-full p-2"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              {getTaskContent()}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="p-2 text-center text-xs text-gray-500">
          Column collapsed
        </div>
      )}
    </div>
  )
}

export default KanbanColumn