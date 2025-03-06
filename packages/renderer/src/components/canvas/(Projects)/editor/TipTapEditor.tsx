// TipTapEditor.tsx
// File Location: /Users/matthewsimon/Documents/Github/solomon-electron/next/src/components/canvas/(Projects)/_components/TipTapEditor.tsx

// TipTapEditor.tsx
// File Location: /Users/matthewsimon/Documents/Github/solomon-electron/next/src/components/canvas/(Projects)/_components/TipTapEditor.tsx
// TipTapEditor.tsx with fixed headers but compatible with parent container

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';

// TipTap Extensions
import { Color } from '@tiptap/extension-color';
import Gapcursor from '@tiptap/extension-gapcursor';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import ImageResize from 'tiptap-extension-resize-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

// Lucide Icons
import {
  Plus,
  Minus,
  ChevronDown,
  Save,
} from 'lucide-react';

// Page Visualization Component
import PageVisualization from './_components/PageVisualization';
// Import the Menubar component and FormattingControls
import { Menubar } from './_components/Menubar';
import { FormattingControls } from './_components/FormattingControls';

// ShadCN components
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Custom extensions
import { FontSizeExtension } from '@/extensions/fontsize';
import { lineHeightExtension } from '@/extensions/lineheight';

// Custom Node extension for page breaks
import { Node, mergeAttributes } from '@tiptap/core';

// Define a custom Page Break extension
const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  selectable: true,
  parseHTML() {
    return [
      { tag: 'div.tiptap-page-break' },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'tiptap-page-break' }), '']
  },
  addCommands() {
    return {
      setPageBreak: () => ({ chain }) => {
        return chain()
          .insertContent({ type: this.name })
          .run()
      },
    }
  },
});

/**
 * TipTapEditor Props Interface
 */
interface TipTapEditorProps {
  onChange: (content: string) => void;
  initialContent?: string;
  immediatelyRender?: boolean;
}

/**
 * Page Size Selector Component
 */
function PageSizeSelector({
  pageSize,
  setPageSize,
}: {
  pageSize: string;
  setPageSize: (size: string) => void;
}) {
  const sizes = ['A4', 'Letter', 'Legal', 'A3', 'Tabloid'];

  return (
    <Select value={pageSize} onValueChange={setPageSize}>
      <SelectTrigger className="w-[100px] h-8">
        <SelectValue placeholder="Page Size" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Page Sizes</SelectLabel>
          {sizes.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/**
 * Zoom Control Component
 */
function ZoomControl({
  zoom,
  handleZoomIn,
  handleZoomOut,
}: {
  zoom: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}) {
  return (
    <div className="flex items-center gap-x-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Zoom Out (⌘-)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <span className="text-xs font-medium w-12 text-center">
        {Math.round(zoom * 100)}%
      </span>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Zoom In (⌘+)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

/**
 * Main TipTapEditor Component with Fixed Headers and Scrollable Content
 */
const TipTapEditor: React.FC<TipTapEditorProps> = ({
  onChange,
  initialContent,
}) => {
  // State management
  const [zoom, setZoom] = useState(1);
  const [pageSize, setPageSize] = useState('A4');
  const [isSaving, setIsSaving] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [editorContent, setEditorContent] = useState('');

  // Reference to editor container for measurements
  const editorRef = useRef<HTMLDivElement>(null);

  /**
   * Initialize TipTap editor with extensions and configurations
   */
  const editor = useEditor({
    editorProps: {
      attributes: {
        style: "padding-left: 56px; padding-right: 56px;",
        class: 'prose prose-slate max-w-none focus:outline-none cursor-text pt-10 tiptap-pagination',
        'data-page-size': pageSize,
      },
    },
    extensions: [
      StarterKit,
      FontSizeExtension,
      FontFamily,
      lineHeightExtension.configure({
        types: ["heading", "paragraph"],
        defaultLineHeight: "normal"
      }),
      Color,
      TextStyle,
      Gapcursor,
      BulletList,
      OrderedList,
      ListItem,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({ 
        openOnClick: false, 
        autolink: true, 
        defaultProtocol: "https" 
      }),
      Image,
      ImageResize,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'listItem'],
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder: 'Start typing here...',
      }),
      // Add our custom PageBreak extension
      PageBreak,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setEditorContent(content);
      onChange(content);
      
      // Update page count estimation based on content
      estimatePageCount();
    },
  });

  // Update editor attributes when page size changes
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          ...editor.options.editorProps,
          attributes: {
            ...editor.options.editorProps.attributes,
            'data-page-size': pageSize,
          },
        },
      });
      
      // Re-estimate page count when page size changes
      estimatePageCount();
    }
  }, [pageSize, editor]);

  // Function to estimate the number of pages based on content
  const estimatePageCount = () => {
    if (!editor || !editorRef.current) return;
    
    // A simple estimation based on the editor content height
    // This could be improved with more sophisticated measurements
    const contentHeight = editorRef.current.scrollHeight;
    const pageSizes: Record<string, number> = {
      'A4': 842,
      'Letter': 792,
      'Legal': 1008,
      'A3': 1191,
      'Tabloid': 1224,
    };
    
    const pageHeight = pageSizes[pageSize] || 842;
    const effectivePageHeight = pageHeight - 100; // Account for margins
    
    // Estimate number of pages and ensure at least 1 page
    const estimatedPages = Math.max(1, Math.ceil(contentHeight / effectivePageHeight));
    setPageCount(estimatedPages);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // Early return if editor is not initialized
  if (!editor) {
    return null;
  }

  /**
   * Handle zoom in with upper limit
   */
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  /**
   * Handle zoom out with lower limit
   */
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  /**
   * Simulate a save action
   */
  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  /**
   * Insert a page break at cursor position
   */
  const insertPageBreak = () => {
    editor.chain().focus().setPageBreak().run();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Section - not sticky, part of the flow */}
      <div className="bg-background z-10">
        {/* Main Menubar */}
        <Menubar 
          editor={editor} 
          handleZoomIn={handleZoomIn} 
          handleZoomOut={handleZoomOut} 
          zoom={zoom} 
        />
        
        {/* Combined row with Save button, Formatting Controls, and Page controls */}
        <div className="flex items-center justify-between border-b bg-muted/10 px-1.5 py-1">
          <div className="flex items-center gap-1">
            {/* Save Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 w-8 mr-1"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Save Document (⌘S)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Insert Page Break Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={insertPageBreak}
                    className="h-8 w-8 mr-1"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Insert Page Break</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Formatting Controls */}
            <FormattingControls editor={editor} />
          </div>
          
          {/* Page Size and Zoom */}
          <div className="flex items-center gap-1">
            <PageSizeSelector pageSize={pageSize} setPageSize={setPageSize} />
            <ZoomControl 
              zoom={zoom} 
              handleZoomIn={handleZoomIn} 
              handleZoomOut={handleZoomOut} 
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto bg-muted/20" id="editor-scrollable-content">
        <div className="h-full p-4">
          <div className="mx-auto h-full">
            <PageVisualization 
              ref={editorRef}
              pageSize={pageSize} 
              zoom={zoom}
              content={editorContent}
              pageMargin="20px"
            >
              <EditorContent
                editor={editor}
                className="h-full w-full bg-background"
                style={{ caretColor: "black" }}
              />
            </PageVisualization>
          </div>
        </div>
      </div>

      {/* Footer with Word Count */}
      <div className="flex items-center justify-between px-3 py-1 border-t bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center gap-x-3">
          <span className="font-medium">Pages: {pageCount}</span>
        </div>
        <div className="flex items-center gap-x-3">
          <span className="font-medium">Words: {editor.storage.characterCount?.words() || 0}</span>
          <span className="font-medium">Characters: {editor.storage.characterCount?.characters() || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default TipTapEditor;