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
  const { toggleSidebar } = useSidebar();

  function handleProjectSelection(projectId: string) {
    setActiveProjectId(projectId);
  }
  function handleCollapseClick() {
    toggleSidebar();
  }
  function handleGraphViewClick() {}
  function handleFilesClick() {}
  function handleProjectsClick() {}
  function handleTasksClick() {}
  function handleCalendarClick() {}

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden pt-9 draggable bg-indigo-100">
      {/*
        The first 9px (the padding-top) is effectively your draggable "title bar."
        Everything else is wrapped in "no-drag," so it won't move the window when clicked or dragged.
      */}
      <div className="flex flex-1 overflow-hidden no-drag">
        <AdminPanel
          onCollapseClick={handleCollapseClick}
          onGraphViewClick={handleGraphViewClick}
          onFilesClick={handleFilesClick}
          onProjectsClick={handleProjectsClick}
          onTasksClick={handleTasksClick}
          onCalendarClick={handleCalendarClick}
        />

        <SidebarWrapper onProjectSelect={handleProjectSelection} />

        <div className="flex flex-1 overflow-hidden">
          <Canvas
            activeProjectId={activeProjectId}
            className="flex-1 min-w-[300px] overflow-visible"
          />
          {isChatActive && <Chat />}
        </div>
      </div>
    </div>
  );
}