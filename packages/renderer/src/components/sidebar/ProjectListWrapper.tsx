// ProjectListWrapper.tsx
"use client";

import React from "react";
import { ProjectList } from "./Project-List";

export default function ProjectListWrapper() {
  // 1. Define the event handler in a client component
  function handleProjectSelect(projectId: string) {
    console.log("Project selected:", projectId);
    // ...or any other logic
  }

  // 2. Render the ProjectList (also a client component)
  return (
    <ProjectList onProjectSelect={handleProjectSelect} />
  );
}