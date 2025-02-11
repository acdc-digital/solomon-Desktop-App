// Dashboard Projects
// /Users/matthewsimon/Documents/GitHub/solomon-electron/solomon-electron/next/src/components/canvas/Projects.tsx

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Title } from "./_components/Title";
import { Button } from "@/components/ui/button";
import { BoltIcon, BotIcon, FolderIcon } from 'lucide-react';
import { useEditorStore } from "@/lib/store/editorStore";
import { UploadDocumentButton } from "./_components/FileTable";
import { FileList } from "./_components/FileList";
// import { DocumentData } from "@/types/DocumentData";

import useChatStore from '@/lib/store/chatStore';
// import FilePreview from "./_components/FilePreview";
import TipTapEditor from "./_components/TipTapEditor";
import dynamic from 'next/dynamic';

const FilePreviewNoSSR = dynamic(() => import('./_components/FilePreview'), {
  ssr: false,
});

// Fetch project data based on projectId
const Projects: React.FC<{ projectId: string }> = ({ projectId }) => {
  // Destructure activateFiles from the store
  const { activeView, setActiveView, selectedFile } = useEditorStore();

  // Destructure activateChat from the store
  const { isChatActive, activateChat } = useChatStore();

  useEffect(() => {
    if (projectId) {
      console.log("Fetching data for project ID:", projectId);
    }
    // This effect runs when projectId changes
    }, [projectId]);

  const update = useMutation(api.projects.update);
  const onChange = async (content: string) => {
    try {
      await update({ id: projectId, content });
    } catch (error) {
      console.error("Update error:", error);
    }
  };  

  const projectIdOrUndefined = projectId ?? undefined;
  const project = useQuery(api.projects.getById, { projectId: projectIdOrUndefined as Id<"projects"> | undefined });

    if (!projectId) {
      // No project ID is set, so display a message
      return (
        <div className="flex items-center justify-center h-full">
          <p>Select a project to continue.</p>
        </div>
      );
    }

    if (project === undefined) {
      return <p>Loading...</p>
    }

    if (project === null) {
      return null;
    }

  return (
      <div className="flex flex-col h-screen overflow-y">
        <p className="ml-4 mt-0 text-xs text-gray-400">
          Showing details for Convex project ID: {projectId}
        </p>
          <div className="flex flex-col items-start justify-between">
            <div className="m-3 rounded-lg border border-b">
            <Title
            initialData={project} 
            />
            </div>
          </div>

          {/* Canvas State-Change Header */}
          <div className="flex flex-row gap-x-4 border rounded-t-lg bg-gray-50 ml-3 mr-3 p-4 pl-4 py-2 justify-end">
              <Button className={`text-gray-600 ${
                      activeView === "editor" ? "border-b border-gray-500" : ""
                      }`}
                      variant="outline"
                      onClick={() => setActiveView("editor")} >
                    <BoltIcon className="mr-2 h-4 w-4" />
                  Editor
              </Button>
              <Button className={`text-gray-600 ${
                      activeView === "files" ? "border-b border-gray-500" : ""
                      }`}
                      variant="outline"
                      onClick={() => setActiveView("files")} >
                    <FolderIcon className="mr-2 h-4 w-4" />
                  Files
              </Button>
              {/* <Button
                className="text-gray-600"
                variant="outline"
                >
                <SquareCheck className="mr-2 h-5 w-5" />
                Tasks
              </Button> */}
              <Button
                className={`text-gray-600 ${
                  isChatActive ? "border-b border-gray-500" : ""
                }`}
                variant="outline"
                onClick={() => activateChat()}
              >
                <BotIcon className="mr-2 h-5 w-5" />
                Chat
              </Button>
          </div>

          {/* State-Change Components */}
          {/* Editor */}
          {activeView === "editor" && (
            <div className="flex flex-col flex-1 ml-3 mr-3 border-b border-l border-r">
            <TipTapEditor
            initialContent={project.content}
            onChange={onChange}
            immediatelyRender={false}
            />
            </div>
          )}
          {/* Files */}
          {activeView === "files" && (
            <div className="ml-3 mr-3 border-b border-l border-r">
              <UploadDocumentButton projectId={projectId} />
              <FileList projectId={projectId} />
            </div>
          )}
          {/* Preview */}
          {activeView === "preview" && selectedFile && (
            <div className="ml-3 mr-3 border-b border-l border-r">
              <FilePreviewNoSSR />
            </div>
      )}
      </div>
    )
};

export default Projects;