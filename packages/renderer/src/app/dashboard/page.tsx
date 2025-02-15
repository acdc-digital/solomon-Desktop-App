// Dashboard 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/app/dashboard/page.tsx

"use client";

import React, { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import SidebarWrapper from "./_components/Sidebar";
import Canvas from "./_components/Canvas";
import Chat from "./_components/Chat";
import useChatStore from "@/lib/store/chatStore";

export default function DashboardPage() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const isChatActive = useChatStore((state) => state.isChatActive);

  function handleProjectSelection(projectId: string) {
    setActiveProjectId(projectId);
  }

  return (
    <SidebarProvider>
      {/* This flex container sets up the columns */}
      <div className="flex h-screen w-screen">
        {/* Left: Our new “AppSidebar” with old logic intact */}
        <SidebarWrapper onProjectSelect={handleProjectSelection} />

        {/* Right: Canvas + optional Chat */}
        <div className="flex flex-1">
          <Canvas activeProjectId={activeProjectId} />
          {isChatActive && <Chat />}
        </div>
      </div>
    </SidebarProvider>
  );
}