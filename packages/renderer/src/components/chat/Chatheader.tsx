// ChatHeader.tsx
// /Users/matthewsimon/Documents/github/solomon-electron/solomon-electron/next/src/components/chat/Chatheader.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEditorStore } from "@/lib/store/editorStore";
import { FolderIcon, Activity, ChevronDown } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatHeaderProps {
  title: string;
}

// This constant is used as a special identifier for graph chat.
export const GRAPH_CHAT_ID = "graph-chat";

const ChatHeader: React.FC<ChatHeaderProps> = ({ title }) => {
  useUser();
  const { projectId, setProjectId } = useEditorStore();

  // Fetch projects for the dropdown. Using undefined for parentProject.
  const projects = useQuery(api.projects.getSidebar, { parentProject: undefined });

  // When a project or graph chat is selected, update state.
  const handleSelect = (id: string) => {
    setProjectId(id);
  };

  // Get active project title
  const getActiveTitle = () => {
    if (projectId === GRAPH_CHAT_ID) return "Graph Chat";
    if (!projectId) return "Select Project";
    
    const activeProject = projects?.find(project => project._id === projectId);
    return activeProject?.title || "Select Chat";
  };

  return (
    <div className="no-drag px-4 py-2.5 border-b flex items-center justify-between bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Title on the left */}
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 min-w-40 justify-between font-normal"
          >
            <span className="truncate flex-1 text-left">
              {getActiveTitle()}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 no-drag" align="end">
          {/* Dedicated Graph Chat Item */}
          <DropdownMenuGroup>
            <DropdownMenuItem 
              onClick={() => handleSelect(GRAPH_CHAT_ID)}
              className={cn(
                "flex items-center cursor-pointer",
                projectId === GRAPH_CHAT_ID && "bg-slate-100 font-medium"
              )}
            >
              <Activity className="mr-2 h-4 w-4 text-indigo-500" />
              <span>Graph Chat</span>
              {projectId === GRAPH_CHAT_ID && (
                <Badge variant="outline" className="ml-auto py-0 px-1.5 h-5">Active</Badge>
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center">
            <span>Projects</span>
            <Badge className="ml-2 bg-slate-200 text-slate-800 hover:bg-slate-200 py-0">
              {projects?.length || 0}
            </Badge>
          </DropdownMenuLabel>
          
          {projects ? (
            projects.length > 0 ? (
              <DropdownMenuGroup>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project._id}
                    onClick={() => handleSelect(project._id)}
                    className={cn(
                      "flex items-center cursor-pointer",
                      projectId === project._id && "bg-slate-100 font-medium"
                    )}
                  >
                    <FolderIcon className="mr-2 h-4 w-4 text-amber-500" />
                    <span className="truncate">{project.title}</span>
                    {projectId === project._id && (
                      <Badge variant="outline" className="ml-auto py-0 px-1.5 h-5">Active</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ) : (
              <div className="px-2 py-2 text-xs text-slate-500 italic text-center">
                No projects found
              </div>
            )
          ) : (
            <div className="p-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ChatHeader;