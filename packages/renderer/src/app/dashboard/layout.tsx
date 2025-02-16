// Dashboard Layout
// /Users/matthewsimon/Documents/GitHub/acdc.solomon-electron/solomon-electron/next/src/app/dashboard/DashboardLayout.tsx

"use client";

import { SearchCommand } from "@/components/search-command";
import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div>
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return redirect("/");
  }

  // Wrap the content in SidebarProvider, so everything under /dashboard
  // can use the sidebar context safely.
  return (
    <SidebarProvider>
      <div className="dashboard-content">
        <SearchCommand />
        {children}
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;