// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/lib/store/editorStore.ts
// store/editorStore.ts

import { create } from "zustand";
import { DocumentData } from "@/types/DocumentData";
import { Id } from "../../../convex/_generated/dataModel";

interface EditorState {
  activeView: "editor" | "files" | "preview" | "users";
  // Added "Tasks" and "Calendar" to match your Admin Panel
  activeComponent: "Admin" | "Files" | "Projects" | "Docs" | "Users" | "Tasks" | "Calendar";
  selectedFile: DocumentData | null;
  projectId: Id<"projects"> | string | null; // Allow a special string like "graph-chat"
  pendingFiles: DocumentData[];
  sortOrder: "asc" | "desc"; // For any sorting logic

  setActiveView: (view: "editor" | "files" | "preview" | "users") => void;
  setActiveComponent: (
    component: "Admin" | "Files" | "Projects" | "Docs" | "Users" | "Tasks" | "Calendar"
  ) => void;
  setSelectedFile: (file: DocumentData | null) => void;
  setProjectId: (id: Id<"projects"> | string | null) => void;
  addPendingFile: (file: DocumentData) => void;
  removePendingFile: (fileId: string) => void;
  toggleSortOrder: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeView: "editor",
  activeComponent: "Admin",
  selectedFile: null,
  projectId: null,
  pendingFiles: [],
  sortOrder: "asc",

  setActiveView: (view) => set({ activeView: view }),
  setActiveComponent: (component) => set({ activeComponent: component }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setProjectId: (id) => set({ projectId: id }),
  addPendingFile: (file) =>
    set((state) => ({ pendingFiles: [...state.pendingFiles, file] })),

  removePendingFile: (fileId) =>
    set((state) => ({
      pendingFiles: state.pendingFiles.filter((file) => file.fileId !== fileId),
    })),

  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
    })),
}));