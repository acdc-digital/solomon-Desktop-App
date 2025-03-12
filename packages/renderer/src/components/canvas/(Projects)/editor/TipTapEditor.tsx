// TipTapEditor.tsx
// File Location: /Users/matthewsimon/Documents/Github/solomon-electron/next/src/components/canvas/(Projects)/_components/TipTapEditor.tsx

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
  Printer 
} from 'lucide-react';

// Ruler Component
import { Ruler } from './_components/Ruler';
// Page Visualization Component
import MultiPageVisualization from './_components/MultiPageVisualization';
import PageBreakComponent from './_components/PageBreak';
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
import { Pagination } from 'tiptap-pagination-breaks';
import { PageBreak } from '@/extensions/page-break';
import { EnhancedPaginationExtension } from '@/extensions/enhanced-pagination';


/**
 * TipTapEditor Props Interface
 */
interface TipTapEditorProps {
  onChange: (content: string) => void;
  initialContent?: string;
  immediatelyRender?: boolean;
}

/**
 * Get page dimensions based on page size
 * Returns width, height, and margin (in pixels)
 */
const getPageDimensions = (size: string) => {
  // Standard margin is 1 inch = 96px
  const margin = 48;
  
  let width, height;
  
  switch(size) {
    case 'A4': 
      width = 595; 
      height = 842;
      break;
    case 'Letter': 
      width = 816;
      height = 1056;
      break;
    case 'Legal': 
      width = 612; 
      height = 1008;
      break;
    case 'A3': 
      width = 842; 
      height = 1191;
      break;
    case 'Tabloid': 
      width = 792; 
      height = 1224;
      break;
    default: 
      width = 612; 
      height = 792;
  }
  
  return { 
    width, 
    height, 
    margin 
  };
};

/**
 * Page Size Selector Component
 */
function PageSizeSelector({
  pageSize,
  setPageSize,
  className = "",
}: {
  pageSize: string;
  setPageSize: (size: string) => void;
  className?: string;
}) {
  const sizes = ['A4', 'Letter', 'Legal', 'A3', 'Tabloid'];

  return (
    <div className={className}>
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
    </div>
  );
}

/**
 * Zoom Control Component
 */
function ZoomControl({
  zoom,
  handleZoomIn,
  handleZoomOut,
  className = "",
}: {
  zoom: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-x-1 ${className}`}>
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
  const [pageSize, setPageSize] = useState('Letter');
  const [isSaving, setIsSaving] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [editorContent, setEditorContent] = useState('');

  // Reference to editor container for measurements
  const editorRef = useRef<HTMLDivElement>(null);

  /**
   * Initialize TipTap editor with extensions and configurations
   */
  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // Set Page-Margin Here (padding)
        style: `
          --page-margin: 48px;
          padding: var(--page-margin);
        `,
        class: 'prose prose-slate max-w-none focus:outline-none cursor-text tiptap-pagination',
        'data-page-size': pageSize,
      },
    },
    extensions: [
      StarterKit,
      FontSizeExtension,
      FontFamily,
      lineHeightExtension.configure({
        types: ["heading", "paragraph"],
        defaultLineHeight: "1.15"
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
      // Configure the Page-Break Custom Extension
      PageBreak,
      EnhancedPaginationExtension({
        pageHeight: getPageDimensions(pageSize).height,
        pageWidth: getPageDimensions(pageSize).width,
        pageMargin: getPageDimensions(pageSize).margin,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setEditorContent(content);
      onChange(content);
      
      // Count the page breaks to determine page count
      let pageBreakCount = 0;
      editor.state.doc.descendants((node) => {
        if (node.type.name === 'pageBreak') {
          pageBreakCount++;
        }
        return true;
      });
      
      setPageCount(pageBreakCount + 1); // Number of breaks + 1 = number of pages
    },
  });

  // Update pagination settings when page size changes
  useEffect(() => {
    if (editor) {
      // Get dimensions based on page size
      const dimensions = getPageDimensions(pageSize);
      
      // Update editor attributes
      editor.setOptions({
        editorProps: {
          ...editor.options.editorProps,
          attributes: {
            ...editor.options.editorProps.attributes,
            'data-page-size': pageSize,
            style: `
              --page-margin: ${dimensions.margin}px;
              padding: var(--page-margin);
            `,
          },
        },
      });
      
      try {
        // Try using the command directly
        if (typeof editor.commands.setPaginationOptions === 'function') {
          editor.commands.setPaginationOptions({
            pageHeight: dimensions.height,
            pageWidth: dimensions.width,
            pageMargin: dimensions.margin,
          });
        } else {
          // Fallback: Update the extensions manually
          console.warn('setPaginationOptions command not found, applying manual update');

          // This is a more direct approach to update the options
          editor.extensionManager.extensions.forEach(extension => {
            if (extension.name === 'enhancedPagination') {
              if (typeof extension.options === 'object') {
                Object.assign(extension.options, {
                  pageHeight: dimensions.height,
                  pageWidth: dimensions.width,
                  pageMargin: dimensions.margin,
                });
              }
            }
          });

          // Force a re-render of the editor
          const currentContent = editor.getHTML();
          editor.commands.setContent(currentContent);
        }
      } catch (error) {
        console.error('Error updating pagination options:', error);
      }
    }
  }, [pageSize, editor]);


  // Add manual page break insertion function
  const insertPageBreak = () => {
    if (editor) {
      // Get the current node position
      const { selection } = editor.state;
      const pos = selection.$anchor.pos;

      // Calculate the current page number based on position
      let currentPage = 1;
      let breakPositions: number[] = [];

      editor.state.doc.descendants((node, nodePos) => {
        if (node.type.name === 'pageBreak') {
          breakPositions.push(nodePos);
          if (nodePos < pos) currentPage++;
        }
        return true;
      });

      // Insert a page break at the current cursor position with the next page number
      editor.commands.insertPageBreak();

      // Set focus after the page break
      setTimeout(() => {
        editor.commands.focus('end');
      }, 10);
    }
  };

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

  // Calculate the approximate header height
  const headerHeight = 180; // Adjust this value based on your actual header height
  // NOT A REAL FOOTER: Fixed Height for Bottom Pages/ Words/ Characters
  const footerHeight = 30;

  /**
 * Editor/ DOM Print Function
 */
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the document');
      return;
    }

    // Get the editor content
    const content = editor.getHTML();

    // Create print-specific CSS
    const printStyles = `
      @page {
        size: letter;
        margin: 48px; /* Match your editor margin */
      }
      body {
        font-family: Arial, Helvetica, sans-serif;
        margin: 0;
        padding: 0;
      }
      .content {
        max-width: 100%;
        margin: 0 auto;
      }
      /* Hide page breaks in print mode */
      .page-break {
        display: none;
        height: 0;
        page-break-after: always;
      }
      /* Preserve formatting from editor */
      h1, h2, h3 { margin-top: 0; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; }
    `;

    // Prepare document content for printing
    const printContent = content.replace(
      /<div class="page-break[\s\S]*?<\/div>/g,
      '<div style="page-break-after:always;height:0;"></div>'
    );

    // Write the document to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Document</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div class="content">${printContent}</div>
        <script>
          // Auto print and close the window after printing
          window.onload = function() {
            window.print();
            // setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Section - not sticky, part of the flow */}
      <div className="bg-background z-10 flex-shrink-0">
        {/* Main Menubar */}
        <Menubar 
          editor={editor} 
          handleZoomIn={handleZoomIn} 
          handleZoomOut={handleZoomOut} 
          zoom={zoom} 
        />
        
        {/* Combined row with Save button, Formatting Controls, and Page controls */}
        <div className="border-b bg-muted/10">
          <div className="flex items-center justify-between px-1.5 py-1 overflow-hidden">
            {/* Left group - save, page break and formatting */}
            <div className="flex items-center gap-1 overflow-x-auto min-w-0 scrollbar-hide">
              {/* Save Button - always visible */}
              {/* Save Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="h-8 w-8 shrink-0"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Save Document (⌘S)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Print Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handlePrint}
                      className="h-8 w-8 shrink-0"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Print Document (⌘P)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="h-8 border-r mx-1 shrink-0 hidden sm:block" />
              
              {/* Formatting Controls - will scroll horizontally if needed */}
              <div className="flex items-center overflow-x-auto scrollbar-hide min-w-0">
                <FormattingControls
                  editor={editor}
                  insertPageBreak={insertPageBreak} // Pass the function here
                />
              </div>
            </div>
            
            {/* Page Size and Zoom - rightmost elements hide first */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <PageSizeSelector 
                pageSize={pageSize} 
                setPageSize={setPageSize} 
                className="hidden md:block" 
              />
              <ZoomControl 
                zoom={zoom} 
                handleZoomIn={handleZoomIn} 
                handleZoomOut={handleZoomOut} 
                className="hidden sm:flex" 
              />
            </div>
          </div>
        </div>
        <Ruler />
      </div>

      {/* Scrollable Content Area */}
      <div className="overflow-auto bg-muted/20 scrollbar-hide"
           id="editor-scrollable-content"
           style={{
            height: `calc(100vh - ${headerHeight + footerHeight}px)`,
            maxHeight: `calc(100% - ${footerHeight}px)`, // Fallback if 100vh doesn't work
            paddingBottom: '60px' // Add padding to ensure scrollability to the end
            }}
           >
        <div className="p-2">
        <MultiPageVisualization
          ref={editorRef}
          pageSize={pageSize}
          zoom={zoom}
          content={editorContent}
          editor={editor}
        >
          <EditorContent
            editor={editor}
            className="w-full bg-background"
            style={{ caretColor: "black" }}
          />
        </MultiPageVisualization>
        </div>
      </div>

      {/* Footer with Word Count */}
      <div className="flex-shrink-0 border-t bg-gray-100 text-xs text-muted-foreground"
            style={{
              height: `${footerHeight}px`,
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10
            }}
          >
        <div className="flex items-center justify-between h-full px-3">
          <div className='flex items-center gap-x-3'>
          <span className="font-medium">Pages: {pageCount}</span>
          <span className="font-medium">Words: {editor.storage.characterCount?.words() || 0}</span>
          <span className="font-medium">Characters: {editor.storage.characterCount?.characters() || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipTapEditor;