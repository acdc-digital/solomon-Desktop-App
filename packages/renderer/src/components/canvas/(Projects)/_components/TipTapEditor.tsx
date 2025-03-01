// TipTapEditor.tsx
// File Location: /Users/matthewsimon/Documents/Github/solomon-electron/next/src/components/canvas/(Projects)/_components/TipTapEditor.tsx

import React, { useState } from 'react';
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  Strikethrough,
  UnderlineIcon,
  HighlighterIcon,
  LinkIcon,
  ImageIcon,
  UndoIcon,
  RedoIcon,
  ListIcon,
  ListOrderedIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  PlusCircle,
  MinusCircle,
  Save,
  SquareCheck,
  ChevronDownIcon,
  UploadIcon,
  Link2Icon,
  MinusIcon,
  PlusIcon,
  ListCollapseIcon,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';

// TipTap Extensions
import { Color } from '@tiptap/extension-color'
import Gapcursor from '@tiptap/extension-gapcursor';
import FontFamily from '@tiptap/extension-font-family'
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
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'



// Shad CN
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
// import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input';
import { FontSizeExtension } from '@/extensions/fontsize';
import { lineHeightExtension } from '@/extensions/lineheight';

import { cn } from '@/lib/utils';
import { type ColorResult, CompactPicker } from "react-color";
import PageVisualization from './PageVisualization';

/**
 * TipTapEditorProps:
 * @property onChange - Callback function fired when editor content updates
 * @property initialContent - Initial HTML content for the editor
 */
interface TipTapEditorProps {
  onChange: (content: string) => void;
  initialContent?: string;
  immediatelyRender?: boolean;
}

/**
   * Page Size Selector
   */
function PageSizeSelector({
  pageSize,
  setPageSize,
}: {
  pageSize: string;
  setPageSize: (size: string) => void;
}) {
  const sizes = ['A4', 'Letter', 'Legal'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 w-[80px] shrink-0 flex items-center justify-between rounded-sm hover:bg-neutral-200/80 px-1.5 text-sm">
          <span>{pageSize}</span>
          <ChevronDownIcon className="ml-1 size-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1">
        {sizes.map((size) => (
          <button
            key={size}
            onMouseDown={(e) => {
              e.preventDefault();
              setPageSize(size);
            }}
            className={cn(
              'flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80',
              pageSize === size && 'bg-neutral-200/80'
            )}
          >
            {size}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * TipTapEditor:
 * A component that renders a rich text editor built with Tiptap.
 * Includes a toolbar, zoom controls, and a page visualization wrapper.
 */
const TipTapEditor: React.FC<TipTapEditorProps> = ({
  onChange,
  initialContent,
}) => {
  // --------------------------------------------
  // State & Editor Setup
  // --------------------------------------------

  // Track the zoom level for the page visualization (range ~0.5 to 3)
  const [zoom, setZoom] = useState(1);
  // Track the chosen page size for <PageVisualization>
  const [pageSize, setPageSize] = useState('A4');

  /**
   * Initialize TipTap's editor with the desired extensions, initial content,
   * and an update callback to track changes in the editor's content.
   */
  const editor = useEditor({
    editorProps: {
      attributes: {
        style: "padding-left: 56px; padding-right: 56px;",
        class: 'prose focus:outline-none cursor-text pt-10', // Tailwind classes for styling
      },
    },

    extensions: [
      /**
       * StarterKit provides many core Tiptap functionalities:
       * - Paragraph, Bold, Italic, Strike, Code, etc.
       *
       * Here we disable built-in bulletList, orderedList, and listItem
       * because we want to import them separately below.
       */
      StarterKit,
      FontSizeExtension,
      FontFamily,
      lineHeightExtension.configure({
        types: ["heading", "paragraph"],
        defaultLineHeight: "normal"
      }),
      Color,
      TextStyle,
      Gapcursor, // Allows the cursor to move around blocks where normally it can't
      BulletList,
      OrderedList,
      ListItem,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      Image,
      ImageResize,
      Table.configure({ resizable: true }),   // Allows resizing table columns
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        // We want to be able to text-align headings, paragraphs, or list items
        types: ['heading', 'paragraph', 'listItem'],
      }),
      Heading.configure({
        // Restrict headings to H1, H2, and H3
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        // A placeholder text that appears when the editor is empty
        placeholder: 'Start typing here...',
      }),
    ],
    content: initialContent, // Load the initial editor content if provided
    onUpdate: ({ editor }) => {
      // Whenever the editor content updates, call onChange with the HTML string
      const content = editor.getHTML();
      onChange(content);
    },
  });

  // Clean up the editor when component unmounts
  React.useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // If editor has not initialized, return null to avoid rendering errors
  if (!editor) {
    return null;
  }

  // --------------------------------------------
  // Insert / Modify Content Helpers
  // --------------------------------------------
   /**
   * Line-Height Button.
   */
  const LineHeightButton = () => {
    const lineHeights = [
      { label: 'Default', value: 'normal' },
      { label: 'Single', value: '1' },
      { label: '1.15',   value: '1.15' },
      { label: '1.5',    value: '1.5' },
      { label: 'Double', value: '2' },
    ];

    return (
      <DropdownMenu>
        {/* Use `asChild` so we can attach onMouseDown to the button */}
        <DropdownMenuTrigger asChild>
          {/* Prevent focus loss on the trigger */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            className="h-7 min-w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
          >
            <ListCollapseIcon className="size-4" />
          </button>
        </DropdownMenuTrigger>

        {/* Also prevent focus loss within the dropdown */}
        <DropdownMenuContent 
          onMouseDown={(e) => e.preventDefault()}
          className="p-1 flex flex-col gap-y-1"
        >
          {lineHeights.map(({ label, value }) => (
            <button
              key={value}
              onMouseDown={(e) => {
                e.preventDefault();
                editor?.chain().focus().setLineHeight(value).run();
              }}
              className={cn(
                'flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80',
                editor?.getAttributes('paragraph').lineHeight === value && 'bg-neutral-200/80'
              )}
            >
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  /**
   * Prompts user for an image URL, then inserts the image into the document.
   */
  {/* const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }; */}

  /**
   * Prompts user to set or unset a hyperlink on the selected text.
   */
  {/* const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);
    if (url === null) return;   // User pressed cancel
    if (url === '') {
      // If empty string, remove existing link
      editor.chain().focus().unsetLink().run();
    } else {
      // Otherwise, set the link to the new URL
      editor.chain().focus().setLink({ href: url }).run();
    }
  }; */}

  /**
   * Enable Font Size Button.
   */
  const FontSizeButton = () => {

    const currentFontSize = editor?.getAttributes("textStyle").fontSize
      ? editor?.getAttributes("textStyle").fontSize.replace("px", "")
      : "16";

    const [fontSize, setFontSize] = useState(currentFontSize);
    const [inputValue, setInputValue] = useState(fontSize);
    const [isEditting, setIsEditing] = useState(false);

    const updateFontSize = (newSize: string) => {
      const size = parseInt(newSize);
      if (!isNaN(size) && size > 0) {
        editor?.chain().focus().setFontSize(`${size}px`).run();
        setFontSize(newSize);
        setInputValue(newSize);
        setIsEditing(false);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
      updateFontSize(inputValue);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        updateFontSize(inputValue);
        // editor?.commands.focus();
      }
    };

    const increment = () => {
      const newSize = parseInt(fontSize) + 1;
      updateFontSize(newSize.toString());
    }

    const decrement = () => {
      const newSize = parseInt(fontSize) - 1;
      if (newSize > 0) {
      updateFontSize(newSize.toString());
      }
    }

    return(
      <div className='flex items-center gap-x-0.5'>
        <button
        onMouseDown={(e) => {
          e.preventDefault();
          decrement();
        }}
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80"
        >
          <MinusIcon className='size-4' />
        </button>
        {isEditting ? (
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="h-7 w-10 text-sm text-center border border-neutral-400 rounded-sm bg-transparent focus:outline-none focus:ring-0"
          />
        ) : (
          <button
          onMouseDown={(e) => {
              e.preventDefault();
            setIsEditing(true);
            setFontSize(currentFontSize);
          }}
          className="h-7 w-10 text-sm text-center border border-neutral-400 rounded-sm bg-transparent cursor-text"
          >
            {currentFontSize}
          </button>
        )}
        <button
        onMouseDown={(e) => {
          e.preventDefault();
          increment();
        }}
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80"
        >
          <PlusIcon className='size-4' />
        </button>
      </div>
    );
  }

  /**
   * Enables Font-Family Dropdown menu.
   */
  const FontFamilyButton = () => {
    const fonts = [
      { Label: "Arial", value: "Arial" },
      { Label: "Times New Roman", value: "Times New Roman" },
      { Label: "Courier New", value: "Courier New" },
      { Label: "Verdana", value: "Verdana" },
    ];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
          className="h-7 w-[120px] shrink-0 flex items-center justify-between rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
          >
            <span className='truncate'>
              {editor?.getAttributes("textStyle").fontFamily || "Arial"}
            </span>
            <ChevronDownIcon className='ml-2 size-4 shrink-0' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='p-1 flex flex-col gap-y-1'>
          {fonts.map(({ Label, value }) => (
            <button
            onMouseDown={(e) => {
              e.preventDefault();
              editor?.chain().focus().setFontFamily(value).run();
            }}
            key={value}
            className={cn(
              "flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80",
              editor?.getAttributes("textStyle").fontFamily === value && "bg-neutral-200/80"
            )}
            style={{ fontFamily: value }}
          >
            <span className='text-sm'>{Label}</span>
          </button>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

   /**
   * Text Color Selector.
   */
  const TextColorButton = () => {
    const value = editor?.getAttributes("textStyle").color || "#000000";

    const onChange = (color: ColorResult) => {
      // Re-focus + apply the color
      editor?.chain().focus().setColor(color.hex).run();
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* 1) Prevent focus loss on the trigger */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
          >
            <span className="text-xs">A</span>
            <div className="h-0.5 w-full" style={{ backgroundColor: value }} />
          </button>
        </DropdownMenuTrigger>

        {/* 2) Also prevent focus loss within the dropdown content */}
        <DropdownMenuContent onMouseDown={(e) => e.preventDefault()}>
          <CompactPicker
            color={value}
            onChange={onChange}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

   /**
   * Highlight Color Selector.
   */
  const HighlightColorButton = () => {
    const value = editor?.getAttributes('highlight').color || '#000000';

    const onChange = (color: ColorResult) => {
      editor?.chain().focus().setHighlight({ color: color.hex }).run();
    };

    return (
      <DropdownMenu>
        {/* Use `asChild` so we can apply onMouseDown on the button itself */}
        <DropdownMenuTrigger asChild>
          {/* 1) Prevent focus loss on the trigger */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
          >
            <HighlighterIcon className="size-4" />
            <div className="h-0.5 w-full" style={{ backgroundColor: value }} />
          </button>
        </DropdownMenuTrigger>

        {/* 2) Also prevent focus loss within the dropdown content */}
        <DropdownMenuContent onMouseDown={(e) => e.preventDefault()}>
          <CompactPicker color={value} onChange={onChange} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

   /**
   * Insert Link Button.
   */
  const LinkButton = () => {
    const [value, setValue] = useState(editor?.getAttributes('link').href || '');

    const onChange = (href: string) => {
      editor?.chain().focus().extendMarkRange('link').setLink({ href }).run();
      setValue('');
    };

    return (
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) {
            setValue(editor?.getAttributes('link').href || '');
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          {/* Prevent focus loss on the trigger */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
          >
            <LinkIcon className="size-4" />
            <div className="h-0.5 w-full" style={{ backgroundColor: value }} />
          </button>
        </DropdownMenuTrigger>

        {/* Prevent focus loss within the dropdown */}
        <DropdownMenuContent
          onMouseDown={(e) => e.preventDefault()}
          className="p-2.5 flex items-center gap-x-2"
        >
          <Input
            placeholder="https://YourLink.com"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {/* Also prevent focus loss on the final apply button */}
          <Button
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(value);
            }}
          >
            Apply
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  /**
   * Insert Image Button.
   */
  const ImageButton = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const onChange = (src: string) => {
      editor?.chain().focus().setImage({ src }).run();
    };

    const onUpload = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const imageUrl = URL.createObjectURL(file);
          onChange(imageUrl);
        }
      }

      input.click();
    };

    const handleImageUrlSubmit = () => {
      if (imageUrl) {
        onChange(imageUrl);
        setImageUrl("");
        setIsDialogOpen(false);
      }
    };

    return(
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
            className='h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm'
            >
              <ImageIcon className='size-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onUpload}>
                <UploadIcon className='size-4 mr-2' />
                Upload
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
              <Link2Icon className='size-4 mr-2' />
                Paste Image URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Image URL</DialogTitle>
            </DialogHeader>
              <Input
                placeholder='Insert URL Image'
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleImageUrlSubmit();
                  }
                }}
              />
              <DialogFooter>
                <Button onClick={handleImageUrlSubmit}>
                  Insert
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  /**
   * Inserts a 3x3 table with a header row into the editor.
   */
  {/* const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }; */}

  /**
   * Dynamically applies a style to toolbar buttons based on the editor’s state.
   * Adds a highlight style if the corresponding feature is active.
   */
  const buttonClass = (isActive: boolean) =>
    `p-1 rounded hover:bg-gray-200 ${isActive ? 'bg-gray-300' : ''}`;

  // --------------------------------------------
  // Zoom Handlers
  // --------------------------------------------

  /**
   * Increase the zoom level in 0.1 increments up to a maximum of 3 (300%).
   */
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  /**
   * Decrease the zoom level in 0.1 increments down to a minimum of 0.5 (50%).
   */
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  // Helper to highlight active states
  const isActive = (name: string, attrs?: Record<string, any>) =>
    editor.isActive(name, attrs) ? 'bg-gray-200' : '';

  // ----------------------------------------------------------------------------
  // Example menubar layout using shadcn/ui dropdowns
  // ----------------------------------------------------------------------------
  return (
    <div className="h-full overflow-hidden">
      {/* 
        1) FIRST ROW (Menubar with dropdowns):
           FILE, EDIT, FORMAT, LISTS, INSERT, VIEW
      */}
      <div className="flex items-center border-b bg-gray-50 p-2 gap-x-2">
        {/* FILE MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              File
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>File Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log('Save clicked!')}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().undo().run()}>
              <UndoIcon className="mr-2 h-4 w-4" />
              Undo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().redo().run()}>
              <RedoIcon className="mr-2 h-4 w-4" />
              Redo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  
        {/* EDIT MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Text &amp; Font</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Font Family */}
            <DropdownMenuItem asChild>
              <div>
                <FontFamilyButton />
              </div>
            </DropdownMenuItem>
            {/* Font Size */}
            <DropdownMenuItem asChild>
              <div>
                <FontSizeButton />
              </div>
            </DropdownMenuItem>
            {/* Text Color */}
            <DropdownMenuItem asChild>
              <div>
                <TextColorButton />
              </div>
            </DropdownMenuItem>
            {/* Highlight */}
            <DropdownMenuItem asChild>
              <div>
                <HighlightColorButton />
              </div>
            </DropdownMenuItem>
            {/* Line Height */}
            <DropdownMenuItem asChild>
              <div>
                <LineHeightButton />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  
        {/* FORMAT MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Format
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Styling &amp; Alignment</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={buttonClass(editor.isActive("bold"))}
            >
              <BoldIcon className="mr-2 h-4 w-4" />
              Bold
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={buttonClass(editor.isActive("italic"))}
            >
              <ItalicIcon className="mr-2 h-4 w-4" />
              Italic
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={buttonClass(editor.isActive("underline"))}
            >
              <UnderlineIcon className="mr-2 h-4 w-4" />
              Underline
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={buttonClass(editor.isActive("strike"))}
            >
              <Strikethrough className="mr-2 h-4 w-4" />
              Strike
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Alignment */}
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={buttonClass(editor.isActive({ textAlign: "left" }) as boolean)}
            >
              <AlignLeftIcon className="mr-2 h-4 w-4" />
              Align Left
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={buttonClass(editor.isActive({ textAlign: "center" }) as boolean)}
            >
              <AlignCenterIcon className="mr-2 h-4 w-4" />
              Align Center
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={buttonClass(editor.isActive({ textAlign: "right" }) as boolean)}
            >
              <AlignRightIcon className="mr-2 h-4 w-4" />
              Align Right
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Headings */}
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={buttonClass(editor.isActive("heading", { level: 1 }))}
            >
              <Heading1Icon className="mr-2 h-4 w-4" />
              H1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={buttonClass(editor.isActive("heading", { level: 2 }))}
            >
              <Heading2Icon className="mr-2 h-4 w-4" />
              H2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={buttonClass(editor.isActive("heading", { level: 3 }))}
            >
              <Heading3Icon className="mr-2 h-4 w-4" />
              H3
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Code Block */}
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={buttonClass(editor.isActive("codeBlock"))}
            >
              <CodeIcon className="mr-2 h-4 w-4" />
              Code Block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  
        {/* LISTS MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Lists
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>List Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={buttonClass(editor.isActive("bulletList"))}
            >
              <ListIcon className="mr-2 h-4 w-4" />
              Bullet List
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={buttonClass(editor.isActive("orderedList"))}
            >
              <ListOrderedIcon className="mr-2 h-4 w-4" />
              Ordered List
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={buttonClass(editor.isActive("taskList"))}
            >
              <SquareCheck className="mr-2 h-4 w-4" />
              Task List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  
        {/* INSERT MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Insert
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Insert Elements</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <div>
                <LinkButton />
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <div>
                <ImageButton />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  
        {/* VIEW MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Zoom Controls</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleZoomOut}>
              <MinusCircle className="mr-2 h-4 w-4" />
              Zoom Out
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleZoomIn}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Zoom In
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              {Math.round(zoom * 100)}%
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
  
      {/* 
        2) SECOND ROW:
           Duplicate some functions for quick access:
           - Font family
           - Page size (and other related buttons)
           - Zoom in/out
      */}
      <div className="flex items-center border-b bg-gray-50 p-2 gap-x-2">
        {/* Duplicate: Font Family */}
        <FontFamilyButton />
        {/* Page Size Selector */}
        <PageSizeSelector pageSize={pageSize} setPageSize={setPageSize} />
        {/* Zoom Controls (duplicated) */}
        <div className="flex items-center gap-x-2">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-gray-200 flex items-center gap-x-1"
          >
            <MinusCircle size={18} />
          </button>
          <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-gray-200 flex items-center gap-x-1"
          >
            <PlusCircle size={18} />
          </button>
        </div>
      </div>
  
      {/* EDITOR CONTENT */}
      <div className="flex-grow bg-gray-200 p-2 h-full">
        <PageVisualization pageSize={pageSize} zoom={zoom}>
          <EditorContent
            editor={editor}
            className="h-full w-full"
            style={{ caretColor: "black" }}
          />
        </PageVisualization>
      </div>
    </div>
  );
};

export default TipTapEditor;