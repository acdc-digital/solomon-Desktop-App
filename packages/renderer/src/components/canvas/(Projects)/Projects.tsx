// PROJECTS
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/Projects.tsx

"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Title } from "./_components/Title";
import { UploadDocumentButton } from "./_components/FileTable";
import { FileList } from "./_components/FileList";
import TipTapEditor from "./editor/TipTapEditor";
import dynamic from "next/dynamic";
import { useEditorStore } from "@/lib/store/editorStore";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BoltIcon, FolderIcon, CheckSquareIcon, Loader2 } from "lucide-react";

// Dynamically import FilePreview component to avoid SSR issues
const FilePreviewNoSSR = dynamic(() => import("./_components/FilePreview"), {
  ssr: false,
});

interface ProjectsProps {
  projectId: string;
}

const Projects: React.FC<ProjectsProps> = ({ projectId }) => {
  const { activeView, setActiveView, selectedFile } = useEditorStore();
  const [containerWidth, setContainerWidth] = useState<number>(1000); // Default value

  // Convex mutations/queries
  const update = useMutation(api.projects.update);
  const project = useQuery(api.projects.getById, {
    projectId: projectId ? (projectId as Id<"projects">) : undefined,
  });

  useEffect(() => {
    if (projectId) {
      console.log("Fetching data for project ID:", projectId);
    }
  }, [projectId]);

  // Setup resize observer to track container width
  useEffect(() => {
    const containerElement = document.getElementById('project-container');
    if (!containerElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle content changes in the editor
  const handleContentChange = async (content: string) => {
    if (!projectId) return;
    
    try {
      await update({ id: projectId, content });
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  // Determine if title should be shown (hide when width is less than 600px)
  const showTitle = containerWidth > 900;

  // Render no project selected state
  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a project to continue.</p>
      </div>
    );
  }

  // Render loading state
  if (project === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Handle project not found
  if (project === null) {
    return null;
  }

  return (
    <div id="project-container" className="flex flex-col bg-gray-100 h-full w-full">
      <div className="flex flex-col flex-1 pt-4">
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as "editor" | "files" | "tasks" | "preview")}
          className="flex flex-col h-full"
        >
          <div className="relative flex items-center justify-between h-5 w-full">
            {/* Left: Title - only shown when container is wide enough */}
            {showTitle && (
              <div className="flex-1 px-4 text-sm">
                <Title initialData={project} />
              </div>
            )}
            
            {/* Right: Folder-style Tabs - adjust spacing based on title visibility */}
            <TabsList className={`relative flex items-center gap-2 ${showTitle ? 'pr-4' : 'flex-1 justify-center'} bg-transparent`}>
              <TabsTrigger
                value="editor"
                className="
                  w-36
                  h-9
                  relative overflow-visible
                  px-3 py-1.5 text-sm font-medium flex items-center gap-1.5
                  border border-gray-200 border-b-0
                  rounded-t-lg
                  transition-all
                  data-[state=active]:rounded-out-b-xl
                  data-[state=active]:bg-white
                  data-[state=active]:z-10
                  data-[state=active]:text-gray-700
                  data-[state=inactive]:bg-gray-50
                  data-[state=inactive]:text-gray-600
                  data-[state=inactive]:hover:bg-gray-100
                "
              >
                <BoltIcon className="h-4 w-4" />
                <span className={containerWidth < 450 ? "hidden" : "block"}>Editor</span>
              </TabsTrigger>

              <TabsTrigger
                value="files"
                className="
                  w-36
                  h-9
                  relative overflow-visible
                  px-3 py-1.5 text-sm font-medium flex items-center gap-1.5
                  border border-gray-200 border-b-0
                  rounded-t-lg
                  transition-all
                  data-[state=active]:rounded-out-b-xl
                  data-[state=active]:bg-white
                  data-[state=active]:z-10
                  data-[state=active]:text-gray-700
                  data-[state=inactive]:bg-gray-50
                  data-[state=inactive]:text-gray-600
                  data-[state=inactive]:hover:bg-gray-100
                "
              >
                <FolderIcon className="h-4 w-4" />
                <span className={containerWidth < 450 ? "hidden" : "block"}>Files</span>
              </TabsTrigger>

              <TabsTrigger
                value="tasks"
                className="
                  w-36
                  h-9
                  relative overflow-visible
                  px-3 py-1.5 text-sm font-medium flex items-center gap-1.5
                  border border-gray-200 border-b-0
                  rounded-t-lg
                  transition-all
                  data-[state=active]:rounded-out-b-xl
                  data-[state=active]:bg-white
                  data-[state=active]:z-10
                  data-[state=active]:text-gray-700
                  data-[state=inactive]:bg-gray-50
                  data-[state=inactive]:text-gray-600
                  data-[state=inactive]:hover:bg-gray-100
                "
              >
                <CheckSquareIcon className="h-4 w-4" />
                <span className={containerWidth < 450 ? "hidden" : "block"}>Tasks</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Add a subtle border between tabs and content */}
          {/* <div className="h-px bg-gray-200 -mt-px relative z-0"></div> */}

          {/* Content Area */}
          <TabsContent value="editor" className="bg-white flex-1 rounded-b-lg">
            <div className="p-0 h-full flex flex-col">
              <TipTapEditor
                initialContent={project.content}
                onChange={handleContentChange}
                immediatelyRender={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="files" className="bg-white p-4 rounded-b-lg">
            <div className="space-y-4">
              <UploadDocumentButton projectId={projectId} />
              <FileList projectId={projectId} />
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="bg-white p-4 rounded-b-lg">
            <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">This is a placeholder for tasks.</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* File Preview Section */}
        {activeView === "preview" && selectedFile && (
          <div className="border border-gray-200 bg-white rounded-lg">
            <div className="p-2 border-b border-gray-200 bg-gray-50 text-sm font-medium">
              File Preview
            </div>
            <FilePreviewNoSSR />
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;