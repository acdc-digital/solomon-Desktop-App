// Dashboard 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/app/dashboard/page.tsx

"use client";

import React, { useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import SidebarWrapper from "./_components/Sidebar";
import AdminPanel from "./_components/adminPanel";
import Canvas from "./_components/Canvas";
import Chat from "./_components/Chat";
import useChatStore from "@/lib/store/chatStore";

export default function DashboardPage() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const isChatActive = useChatStore((state) => state.isChatActive);

  // Now safe to call useSidebar() because layout wraps us in <SidebarProvider>
  const { toggleSidebar } = useSidebar();

  // Example onClick handlers (adapt to your logic)
  function handleProjectSelection(projectId: string) {
    setActiveProjectId(projectId);
  }

  function handleCollapseClick() {
    // We call toggleSidebar() to expand/collapse the main sidebar
    toggleSidebar();
  }

  function handleGraphViewClick() {
    // Was "Admin" in your old CanvasHeader
  }

  function handleFilesClick() {
    // Same as your old 'Files' button logic
  }

  function handleProjectsClick() {
    // Same as your old 'Projects' button logic
  }

  function handleTasksClick() {
    // Placeholder: do something or set up a route
  }

  function handleCalendarClick() {
    // Placeholder: do something or set up a route
  }

  return (
    <div className="flex h-screen max-h-screen w-screen max-w-screen overflow-hidden">
      {/* Slim adminPanel */}
      <AdminPanel
        onCollapseClick={handleCollapseClick}
        onGraphViewClick={handleGraphViewClick}
        onFilesClick={handleFilesClick}
        onProjectsClick={handleProjectsClick}
        onTasksClick={handleTasksClick}
        onCalendarClick={handleCalendarClick}
      />

      {/* Sidebar */}
      <SidebarWrapper onProjectSelect={handleProjectSelection} />

      {/* Chat */}
      <div className="flex flex-1 overflow-hidden">
        <Canvas 
          activeProjectId={activeProjectId}
          className="flex-1 min-w-[300px] overflow-hidden"
        />
        {isChatActive && <Chat />}
      </div>
    </div>
  );
}