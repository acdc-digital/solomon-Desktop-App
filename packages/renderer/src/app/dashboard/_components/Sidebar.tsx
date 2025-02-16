// Sidebar
// /Users/matthewsimon/Documents/GitHub/acdc.solomon-electron/solomon-electron/next/src/app/dashboard/_components/Sidebar.tsx

"use client";

import React from "react";
import {
  PlusCircle,
  Search,
  Settings,
  Trash2Icon,
} from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { api } from "../../../../convex/_generated/api";
import { useSearch } from "@/hooks/use-search";
import { useSettings } from "@/hooks/use-settings";
import { useEditorStore } from "@/lib/store/editorStore";
import { Trashbox } from "@/components/sidebar/Trashbox";
import { ProjectList } from "@/components/sidebar/Project-List";

import {
  Sidebar,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface SidebarProps {
  onProjectSelect: (projectId: string) => void;
}

export function AppSidebar({ onProjectSelect }: SidebarProps) {
  const { state } = useSidebar(); // "expanded" or "collapsed"
  const search = useSearch();
  const settings = useSettings();
  const { setProjectId } = useEditorStore();
  const createProject = useMutation(api.projects.create);

  function handleCreate() {
    const promise = createProject({ title: "New Project" });
    toast.promise(promise, {
      loading: "Creating a new Project...",
      success: "New Project Created!",
      error: "Failed to Create a new Project",
    });
  }

  function handleProjectSelect(projectId: string) {
    setProjectId(projectId);
    onProjectSelect(projectId);
  }

  // If collapsed, don't render anything
  if (state === "collapsed") {
    return null; 
  }

  return (
    <Sidebar
      // Remove collapsible="icon" so it won't show a slim icon column
      side="left"
      variant="sidebar"
      className="relative border-r border-gray-200 bg-white"
    >
      {/* <SidebarHeader> ... your old toggle code (commented out) ... </SidebarHeader> */}

      <SidebarSeparator />

      {/* MAIN SCROLLABLE CONTENT */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-gray-400 px-3 mt-1">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-0.5">
            <SidebarMenu className="space-y-0">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={search.onOpen}
                  className="
                    transition-colors duration-150
                    hover:bg-gray-100 hover:text-gray-900
                    rounded-md px-2 py-0
                    flex items-center
                    text-sm text-gray-600
                    [&>svg]:mr-2
                    [&>svg]:h-4
                    [&>svg]:w-4
                  "
                >
                  <Search />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleCreate}
                  className="
                    transition-colors duration-150
                    hover:bg-gray-100 hover:text-gray-900
                    rounded-md px-2 py-0
                    flex items-center
                    text-sm text-gray-600
                    [&>svg]:mr-2
                    [&>svg]:h-4
                    [&>svg]:w-4
                  "
                >
                  <PlusCircle />
                  <span>New Project</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-xs text-gray-400 px-3 mb-0.5">
            Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ProjectList onProjectSelect={handleProjectSelect} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* FOOTER: Trash + Settings */}
      <SidebarFooter className="px-2 pb-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-gray-400 px-1 mb-0.5">
            Utilities
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger asChild>
                    <SidebarMenuButton
                      className="
                        transition-colors duration-150
                        hover:bg-gray-100 hover:text-gray-900
                        rounded-md px-2 py-1
                        flex items-center
                        text-sm text-gray-600
                        [&>svg]:mr-2
                        [&>svg]:h-4
                        [&>svg]:w-4
                      "
                    >
                      <Trash2Icon />
                      <span>Trashcan</span>
                    </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0">
                    <Trashbox />
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={settings.onOpen}
                  className="
                    transition-colors duration-150
                    hover:bg-gray-100 hover:text-gray-900
                    rounded-md px-2 py-1
                    flex items-center
                    text-sm text-gray-600
                    [&>svg]:mr-2
                    [&>svg]:h-4
                    [&>svg]:w-4
                  "
                >
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {state === "expanded" && (
          <p className="px-3 pt-2 text-xs text-gray-400">© 2025 Solomon</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

const SidebarWrapper: React.FC<SidebarProps> = (props) => {
  return <AppSidebar {...props} />;
};

export default SidebarWrapper;