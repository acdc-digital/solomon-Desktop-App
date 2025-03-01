// adminPanel.tsx
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/app/dashboard/_components/adminPanel.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,      // For GraphView (old "Admin")
  Files as FilesIcon,
  FolderGit2,        // Projects
  AlarmClockCheck,   // Tasks
  CalendarDays,      // Calendar
  BookOpenCheck,     // Docs
  PanelLeftDashed,   // Collapse
  BotMessageSquare   // New Chat placeholder icon
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { useEditorStore } from "@/lib/store/editorStore";
import useChatStore from "@/lib/store/chatStore";

const AdminPanel: React.FC = () => {
  // Get the sidebar state from the Sidebar context.
  const { state, toggleSidebar } = useSidebar();
  const sidebarExpanded = state === "expanded";

  // Retrieve editor state for activeComponent.
  const activeComponent = useEditorStore((state) => state.activeComponent);
  const setActiveComponent = useEditorStore((state) => state.setActiveComponent);

  // Retrieve chat state.
  const isChatActive = useChatStore((state) => state.isChatActive);
  const activateChat = useChatStore((state) => state.activateChat);

  // Handlers.
  function handleCollapseClick() {
    toggleSidebar();
  }
  function handleChatClick() {
    activateChat();
    console.log("Chat button clicked!");
  }
  function handleGraphViewClick() {
    setActiveComponent("Admin");
  }
  function handleFilesClick() {
    setActiveComponent("Files");
  }
  function handleProjectsClick() {
    setActiveComponent("Projects");
  }
  function handleTasksClick() {
    setActiveComponent("Tasks");
  }
  function handleDocsClick() {
    setActiveComponent("Docs");
  }
  function handleCalendarClick() {
    setActiveComponent("Calendar");
  }

  // Outline style for active state.
  const activeOutline = "ring-1 ring-gray-200";

  return (
    <div className="w-14 flex flex-col items-center bg-gray-100 border-r p-0.75 space-y-2 pt-3">
      {/* Collapse Button: outlined only when sidebar is expanded */}
      <Button
        variant="ghost"
        onClick={handleCollapseClick}
        className={`p-0 w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors duration-150 ${
          sidebarExpanded ? activeOutline : ""
        }`}
      >
        <PanelLeftDashed className="w-5 h-5" />
      </Button>

      {/* Chat Button: outlined only when chat is active, independent of sidebar state */}
      <Button
        variant="ghost"
        onClick={handleChatClick}
        className={`p-0 w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors duration-150 ${
          isChatActive ? activeOutline : ""
        }`}
      >
        <BotMessageSquare className="w-5 h-5" />
      </Button>

      {/* Graphview (Admin) Button */}
      <Button
        variant="ghost"
        onClick={handleGraphViewClick}
        className={`p-0 w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors duration-150 ${
          activeComponent === "Admin" ? activeOutline : ""
        }`}
      >
        <BrainCircuit className="w-5 h-5" />
      </Button>

      {/* Projects Button */}
      <Button
        variant="ghost"
        onClick={handleProjectsClick}
        className={`p-0 w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors duration-150 ${
          activeComponent === "Projects" ? activeOutline : ""
        }`}
      >
        <FolderGit2 className="w-5 h-5" />
      </Button>

      {/* Files Button */}
      <Button
        variant="ghost"
        onClick={handleFilesClick}
        className={`p-0 w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors duration-150 ${
          activeComponent === "Files" ? activeOutline : ""
        }`}
      >
        <FilesIcon className="w-5 h-5" />
      </Button>

      {/* Tasks Button */}
      <Button
        variant="ghost"
        onClick={handleTasksClick}
        className={`p-0 w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors duration-150 ${
          activeComponent === "Tasks" ? activeOutline : ""
        }`}
      >
        <AlarmClockCheck className="w-5 h-5" />
      </Button>

      {/* Calendar Button */}
      <Button
        variant="ghost"
        onClick={handleCalendarClick}
        className={`p-0 w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors duration-150 ${
          activeComponent === "Calendar" ? activeOutline : ""
        }`}
      >
        <CalendarDays className="w-5 h-5" />
      </Button>

      {/* Docs Button */}
      <Button
        variant="ghost"
        onClick={handleDocsClick}
        className={`p-0 w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors duration-150 ${
          activeComponent === "Docs" ? activeOutline : ""
        }`}
      >
        <BookOpenCheck className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default AdminPanel;