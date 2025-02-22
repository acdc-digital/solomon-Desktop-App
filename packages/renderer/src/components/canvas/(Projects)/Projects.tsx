"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Title } from "./_components/Title";
import { UploadDocumentButton } from "./_components/FileTable";
import { FileList } from "./_components/FileList";
import TipTapEditor from "./_components/TipTapEditor";
import dynamic from "next/dynamic";

import { useEditorStore } from "@/lib/store/editorStore";
// import useChatStore from "@/lib/store/chatStore"; // Commented out chat store

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
// Added CheckSquareIcon for "Tasks" tab:
import { BoltIcon, FolderIcon, CheckSquareIcon } from "lucide-react";

const FilePreviewNoSSR = dynamic(() => import("./_components/FilePreview"), {
  ssr: false,
});

const Projects: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { activeView, setActiveView, selectedFile } = useEditorStore();
  // const { isChatActive, activateChat } = useChatStore(); // Commented out chat store

  // Convex mutations/queries
  const update = useMutation(api.projects.update);
  const projectIdOrUndefined = projectId ?? undefined;
  const project = useQuery(api.projects.getById, {
    projectId: projectIdOrUndefined as Id<"projects"> | undefined,
  });

  useEffect(() => {
    if (projectId) {
      console.log("Fetching data for project ID:", projectId);
    }
  }, [projectId]);

  const onChange = async (content: string) => {
    try {
      await update({ id: projectId, content });
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Select a project to continue.</p>
      </div>
    );
  }

  if (project === undefined) {
    return <p>Loading...</p>;
  }

  if (project === null) {
    return null;
  }

  const handleTabChange = (value: string) => {
    if (value === "editor") {
      setActiveView("editor");
    } else if (value === "files") {
      setActiveView("files");
    } else if (value === "tasks") {
      setActiveView("tasks");
    }
  };

  const currentTabValue = activeView;

  return (
    <div className="flex flex-col bg-gray-100 h-full w-full p-2">
      <div className="flex flex-col flex-1 ml-3 mr-3">
        <Tabs
          value={currentTabValue}
          onValueChange={handleTabChange}
          className="flex flex-col h-full"
        >
          <TabsList className="relative flex items-center justify-between h-9 w-full pt-4">
            {/* Left: Title */}
            <div className="flex-1 px-4 py-2 text-sm font-semibold">
              <Title initialData={project} />
            </div>
            {/* Right: Tab Triggers */}
            <div className="flex items-center gap-2 pr-4">
              <TabsTrigger
                value="editor"
                className="
                  w-40
                  h-10
                  relative overflow-visible
                  px-4 py-2 text-sm font-semibold flex items-center gap-2
                  border border-gray-200 border-b-0
                  data-[state=active]:rounded-out-b-xl
                  data-[state=active]:bg-white
                  data-[state=active]:z-10
                "
              >
                <BoltIcon className="h-4 w-4" />
                Editor
              </TabsTrigger>

              <TabsTrigger
                value="files"
                className="
                  w-40
                  h-10
                  relative overflow-visible
                  px-4 py-2 text-sm font-semibold flex items-center gap-2
                  border border-gray-200 border-b-0
                  data-[state=active]:rounded-out-b-xl
                  data-[state=active]:bg-white
                  data-[state=active]:z-10
                "
              >
                <FolderIcon className="h-4 w-4" />
                Files
              </TabsTrigger>

              <TabsTrigger
                value="tasks"
                className="
                  w-40
                  h-10
                  relative overflow-visible
                  px-4 py-2 text-sm font-semibold flex items-center gap-2
                  border border-gray-200 border-b-0
                  data-[state=active]:rounded-out-b-xl
                  data-[state=active]:bg-white
                  data-[state=active]:z-10
                "
              >
                <CheckSquareIcon className="h-4 w-4" />
                Tasks
              </TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="editor" className="bg-white flex-1">
            <div className="p-0 h-full flex flex-col">
              <TipTapEditor
                initialContent={project.content}
                onChange={onChange}
                immediatelyRender={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="files" className="bg-white p-4">
            <UploadDocumentButton projectId={projectId} />
            <FileList projectId={projectId} />
          </TabsContent>

          <TabsContent value="tasks" className="bg-white p-4">
            <div className="p-2 text-sm">
              <p>This is a placeholder for tasks.</p>
            </div>
          </TabsContent>
        </Tabs>

        {activeView === "preview" && selectedFile && (
          <div className="border-l border-r border-b border-gray-200 p-4">
            <FilePreviewNoSSR />
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;