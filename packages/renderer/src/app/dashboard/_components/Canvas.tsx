// Canvas.tsx
// /Users/matthewsimon/Documents/github/solomon-electron/solomon-electron/next/src/app/dashboard/_components/Canvas.tsx

"use client";

import React from "react";

// Remove CanvasHeader import
// import CanvasHeader from '@/components/canvas/Canvasheader';

import Admin from "@/components/canvas/(Admin)/Admin";
import Projects from "@/components/canvas/(Projects)/Projects";
import Files from "@/components/canvas/(Files)/Files";
// import Tasks from '@/components/canvas/(Tasks)/Tasks';
import Docs from "@/components/canvas/(Docs)/Docs";
import Users from "@/components/canvas/(User)/Users";

import { useEditorStore } from "@/lib/store/editorStore";

interface CanvasProps {
  activeProjectId: string | null;
  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({ activeProjectId, className }) => {
  // Access activeComponent from Zustand store
  const activeComponent = useEditorStore((state) => state.activeComponent);

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
      default:
        return <Admin />;
    }
  };

  return (
    <div className={`flex flex-col bg-[#FFF] overflow-hidden dark:bg-neutral-200 ${className || ''}`}>
      {renderComponent()}
    </div>
  );
};

export default Canvas;