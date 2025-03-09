// Canvas.tsx
// /Users/matthewsimon/Documents/github/solomon-electron/solomon-electron/next/src/app/dashboard/_components/Canvas.tsx

"use client";

import React from "react";
import Admin from "@/components/canvas/(Admin)/Admin";
import Projects from "@/components/canvas/(Projects)/Projects";
import Files from "@/components/canvas/(Files)/Files";
import Docs from "@/components/canvas/(Docs)/Docs";
import Users from "@/components/canvas/(User)/Users";
import Tasks from "@/components/canvas/(Tasks)/Tasks";
import { useEditorStore } from "@/lib/store/editorStore";
import useChatStore from "@/lib/store/chatStore"; // Import chatStore

interface CanvasProps {
  activeProjectId: string | null;
  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({ activeProjectId, className }) => {
  // Access activeComponent from Zustand store
  const activeComponent = useEditorStore((state) => state.activeComponent);
  const { isChatActive, chatWidth } = useChatStore(); // Get chat state

  const renderComponent = () => {
    switch (activeComponent) {
      case "Admin":
        return <Admin />;
      case "Files":
        return <Files />;
      case "Projects":
        return <Projects projectId={activeProjectId} />;
      case "Docs":
        return <Docs />;
      case "Users":
        return <Users />;
      case "Tasks":
        return <Tasks/>;
      default:
        return <Admin />;
    }
  };

  return (
    <div 
      className={`flex flex-col bg-[#FFF] overflow-hidden dark:bg-neutral-200 border-t border-gray-200 ${className || ''}`}
      style={{
        // Add right padding when chat is active to prevent content from being hidden
        paddingRight: isChatActive ? `${chatWidth}px` : '0'
      }}
    >
      {renderComponent()}
    </div>
  );
};

export default Canvas;