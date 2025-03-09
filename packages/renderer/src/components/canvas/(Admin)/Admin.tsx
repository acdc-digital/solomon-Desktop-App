// Admin Dashbaord
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/components/canvas/(Admin)/Admin.tsx

'use client'

// next/src/components/canvas/Admin.tsx
import React from "react";
import GraphPage from "./_components/graph";

const Admin = () => {
  return (
    <div className="flex flex-col h-full w-full p-4">
      {/* Main Content Area with Padding and Scroll Handling */}
      <div className="flex-grow overflow-auto bg-white border border-gray-200 rounded-md shadow-md relative">
        {/* Absolute positioning to contain the graph */}
        <div className="absolute inset-0">
            <GraphPage />
        </div>
      </div>
    </div>
  );
};

export default Admin;