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
  PanelLeftDashed,        // Collapse
  BotMessageSquare   // New Chat placeholder icon
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";  // For collapse logic
import { useEditorStore } from "@/lib/store/editorStore";
import useChatStore from "@/lib/store/chatStore";

const AdminPanel: React.FC = () => {
  const { toggleSidebar } = useSidebar();

  const setActiveComponent = useEditorStore((state) => state.setActiveComponent);

    // Destructure the activateChat function from the chat store
    const activateChat = useChatStore((state) => state.activateChat);

  // Handlers
  function handleCollapseClick() {
    toggleSidebar();
  }

  // New chat placeholder
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

  return (
    <div className="flex flex-col items-center bg-gray-100 border-r p-0.75 space-y-2 pt-3">
      {/* 1) Collapse Button */}
      <Button variant="ghost" onClick={handleCollapseClick}>
        <PanelLeftDashed className="w-5 h-5" />
      </Button>

      {/* 2) Chat placeholder (new) */}
      <Button variant="ghost" onClick={handleChatClick}>
        <BotMessageSquare className="w-5 h-5" />
      </Button>

      {/* 3) Graphview (old 'Admin') */}
      <Button variant="ghost" onClick={handleGraphViewClick}>
        <BrainCircuit className="w-5 h-5" />
      </Button>

      {/* 4) Projects */}
      <Button variant="ghost" onClick={handleProjectsClick}>
        <FolderGit2 className="w-5 h-5" />
      </Button>

      {/* 5) Files */}
      <Button variant="ghost" onClick={handleFilesClick}>
        <FilesIcon className="w-5 h-5" />
      </Button>

      {/* 6) Tasks */}
      <Button variant="ghost" onClick={handleTasksClick}>
        <AlarmClockCheck className="w-5 h-5" />
      </Button>

      {/* 7) Calendar */}
      <Button variant="ghost" onClick={handleCalendarClick}>
        <CalendarDays className="w-5 h-5" />
      </Button>

      {/* 8) Docs */}
      <Button variant="ghost" onClick={handleDocsClick}>
        <BookOpenCheck className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default AdminPanel;