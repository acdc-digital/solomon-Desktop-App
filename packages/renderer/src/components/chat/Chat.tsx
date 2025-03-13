// Chat.tsx
// /Users/matthewsimon/Documents/github/solomon-electron/solomon-electron/next/src/components/chat/Chat.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAction, useQuery, ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import useChatStore from '@/lib/store/chatStore';
import ChatHeader, { GRAPH_CHAT_ID } from "./Chatheader";
import { ArrowUp, X, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Interfaces
interface ChatEntry {
  _id: string;
  input: string;
  response: string;
}

interface PendingMessage {
  id: string;
  input: string;
}

interface ChatProps {
  projectId: string; // Either a regular project id or "graph-chat"
}

const MAX_CHAR_COUNT = 1000;

// Initialize the client outside the component
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Inner component that uses Convex hooks
function ChatInner({ projectId }: ChatProps) {
  const { isChatActive, deactivateChat } = useChatStore();
  const isGraphChat = projectId === GRAPH_CHAT_ID;

  // Queries & Actions
  const entries = useQuery(
    isGraphChat ? api.graphChat.getAllGraphChatEntries : api.chat.getAllEntries,
    isGraphChat ? {} : { projectId }
  );
  
  const handleUserAction = useAction(
    isGraphChat ? api.graphChat.handleGraphUserAction : api.chat.handleUserAction
  );

  // Local states
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };
    
    // Small delay to ensure content is rendered
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [entries, pendingMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Handle message submission
  const onSubmit = async (msg: string) => {
    if (msg.trim() === "") return;
    
    setMessage("");
    setIsLoading(true);
    
    const pendingId = `pending-${Date.now()}`;
    setPendingMessages((prev) => [...prev, { id: pendingId, input: msg }]);

    try {
      if (isGraphChat) {
        await handleUserAction({ message: msg });
      } else {
        await handleUserAction({ message: msg, projectId });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove pending messages once they appear in server response
  useEffect(() => {
    if (!entries || entries.length === 0) return;
    setPendingMessages((prev) =>
      prev.filter((pm) => !entries.some((entry) => entry.input === pm.input))
    );
  }, [entries]);

  // Copy message to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedMessageId(id);
        setTimeout(() => {
          setCopiedMessageId(null);
        }, 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Merge pending and server messages
  const mergedEntries: Array<ChatEntry | PendingMessage> = [
    ...(entries || []),
    ...pendingMessages,
  ];

  const charCount = message.length;
  const isOverLimit = charCount > MAX_CHAR_COUNT;

  return (
    <div className="relative flex flex-col h-full bg-white">
      <ChatHeader title="" />

      {/* Close Button Row */}
      <div className="flex items-center justify-end px-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={deactivateChat}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-6"
      >
        {mergedEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Ask Solomon a question to begin.</p>
          </div>
        ) : (
          mergedEntries.map((entry) => {
            const isEphemeral = !("_id" in entry);
            const messageId = isEphemeral ? entry.id : entry._id;
            
            return (
              <div
                key={messageId}
                className="flex flex-col gap-4"
              >
                {/* User Message */}
                <div className="flex flex-col items-end">
                  <div className="text-sm text-gray-500 mb-1">You:</div>
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md max-w-[85%] break-words self-end">
                    {entry.input}
                  </div>
                </div>

                {/* Assistant Response */}
                {isEphemeral ? (
                  <div className="flex flex-col mt-2">
                    <div className="text-sm text-gray-500 mb-1">Solomon:</div>
                    <div className="text-gray-400 ml-2">Thinking...</div>
                  </div>
                ) : (
                  "response" in entry && entry.response && (
                    <div className="flex flex-col mt-2">
                      <div className="text-sm text-gray-500 mb-1">Solomon:</div>
                      <div className="ml-2 text-gray-800 prose prose-sm max-w-none">
                        <ReactMarkdown
                        //  remarkPlugins={[remarkGfm]}
                        //  rehypePlugins={[rehypeHighlight]}
                        >
                          {entry.response}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Feedback and Copy Buttons */}
                      <div className="flex mt-2 ml-2 gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <ThumbsUp className="h-4 w-4 text-gray-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Helpful</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <ThumbsDown className="h-4 w-4 text-gray-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Not helpful</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => copyToClipboard(entry.response, messageId)}
                            >
                              {copiedMessageId === messageId ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {copiedMessageId === messageId ? "Copied!" : "Copy to clipboard"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="border-t border-gray-200 bg-gray-50 p-2">
        <form
          className="flex flex-col gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isOverLimit && message.trim() !== "") {
              onSubmit(message);
            }
          }}
        >
          {/* Character Count */}
          <div className="flex justify-end text-xs">
            <span className={isOverLimit ? "text-red-500" : "text-gray-500"}>
              {charCount}/{MAX_CHAR_COUNT}
            </span>
          </div>
          
          {/* Textarea Container with integrated button */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isOverLimit && message.trim() !== "") {
                    onSubmit(message);
                  }
                }
              }}
              className={`w-full px-4 py-4 pr-12 bg-white border rounded-md focus:outline-none resize-none leading-normal ${
                isOverLimit ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-gray-300"
              }`}
              placeholder="Type your message..."
              style={{ overflow: "auto", maxHeight: "120px", minHeight: "44px" }}
              disabled={isLoading}
            />
            
            {/* Integrated Send Button - Now vertically centered */}
            <Button
              type="submit"
              size="icon"
              disabled={message.trim() === "" || isLoading || isOverLimit}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-md ${
                message.trim() === "" || isLoading || isOverLimit
                  ? "bg-indigo-300 text-white"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
      
      {/* Full-width visible resizer */}
      {/* <div className="h-1.5 w-full bg-gray-200 hover:bg-gray-300 cursor-ns-resize" /> */}
    </div>
  );
}

// Wrapper component that provides Convex context
export default function Chat(props: ChatProps) {
  // Debug to help identify what's happening
  console.log("Chat component rendering with Convex provider, projectId:", props.projectId);
  
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        <ChatInner {...props} />
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}