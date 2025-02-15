// Sidebar
// /Users/matthewsimon/Documents/GitHub/acdc.solomon-electron/solomon-electron/next/src/app/dashboard/_components/Sidebar.tsx

"use client";

import React from "react";
import {
  PlusCircle,
  Search,
  Settings,
  Trash2Icon,
  PanelRightOpen,
  PanelRightClose,
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
  SidebarHeader,
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface SidebarProps {
  onProjectSelect: (projectId: string) => void;
}

export function AppSidebar({ onProjectSelect }: SidebarProps) {
  const { state, toggleSidebar } = useSidebar(); // ShadCN sidebar state
  const search = useSearch();
  const settings = useSettings();
  const { setProjectId } = useEditorStore();
  const createProject = useMutation(api.projects.create);

  // Create a new project
  function handleCreate() {
    const promise = createProject({ title: "New Project" });
    toast.promise(promise, {
      loading: "Creating a new Project...",
      success: "New Project Created!",
      error: "Failed to Create a new Project",
    });
  }

  // When a project is selected
  function handleProjectSelect(projectId: string) {
    setProjectId(projectId);
    onProjectSelect(projectId);
  }

  return (
    <Sidebar
      collapsible="icon"
      side="left"
      variant="sidebar"
      className="relative"
    >
      {/** -------------------------------------------
           HEADER (sticky at top, only expand/collapse)
      -------------------------------------------- */}
      <SidebarHeader>
        {/**
         * Force a horizontal layout with some spacing 
         * so the expand/collapse button is in the top row, clearly visible.
         */}
        <SidebarMenu className="!flex-row items-center gap-2 p-2">
          <SidebarMenuItem className="inline-flex">
            <SidebarMenuButton
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="
                transition-colors duration-150
                hover:bg-muted hover:text-muted-foreground
                px-2

                /* Force any SVG child inside */
                [&>svg]:!h-6
                [&>svg]:!w-6
              "
            >
              {state === "expanded" ? (
                <PanelRightClose />
              ) : (
                <PanelRightOpen />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/** -------------------------------------------
           MAIN SCROLLABLE CONTENT
      -------------------------------------------- */}
      <SidebarContent>
        {/** Tools group: Search + New Project */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={search.onOpen}
                  className="transition-colors duration-150 hover:bg-muted hover:text-muted-foreground"
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleCreate}
                  className="transition-colors duration-150 hover:bg-muted hover:text-muted-foreground"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>New Project</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/** Projects group: project tree */}
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <ProjectList onProjectSelect={handleProjectSelect} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/** -------------------------------------------
           FOOTER: Trash + Settings
      -------------------------------------------- */}
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Utilities</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger asChild>
                    <SidebarMenuButton className="transition-colors duration-150 hover:bg-muted hover:text-muted-foreground">
                      <Trash2Icon className="mr-2 h-4 w-4" />
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
                  className="transition-colors duration-150 hover:bg-muted hover:text-muted-foreground"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/** Show “© 2025 Solomon” only if expanded */}
        {state === "expanded" && (
          <p className="px-6 py-2 text-xs text-muted-foreground">
            © 2025 Solomon
          </p>
        )}
      </SidebarFooter>

      {/**
       * No <SidebarRail> since we handle the collapse button in the header row.
       */}
    </Sidebar>
  );
}

const SidebarWrapper: React.FC<SidebarProps> = (props) => {
  return <AppSidebar {...props} />;
};

export default SidebarWrapper;