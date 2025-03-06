// Menubar.tsx
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/Editor/_components/Menubar.tsx

import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

// Import your extracted components
import { LinkButton } from './LinkButton';
import { ImageButton } from './ImageButton';

// Lucide icons
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  Strikethrough,
  UnderlineIcon,
  UndoIcon,
  RedoIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Save,
  FileIcon,
  EditIcon,
  ListIcon,
  ListOrderedIcon,
  SquareCheck,
  PlusCircle,
  MinusCircle,
  LinkIcon,
  ImageIcon,
  TableIcon,
  ColumnsIcon,
  EyeIcon,
  Settings2Icon,
  ChevronDownIcon,
  HighlighterIcon,
  PencilIcon,
  Undo2Icon,
  Redo2Icon,
  BookOpenIcon,
  PanelLeftIcon,
  PanelRightIcon,
  HelpCircleIcon,
  CommandIcon,
  RotateCcwIcon,
  Type,
  GripHorizontal,
  Palette,
} from 'lucide-react';

/**
 * Props for Menubar component
 */
interface MenubarProps {
  editor: Editor;
  handleZoomIn?: () => void;
  handleZoomOut?: () => void;
  zoom?: number;
  onInsertLink?: () => void;
  onInsertImage?: () => void;
}

/**
 * Menubar: A top-level menu bar with File, Edit, Format, Lists, Insert, View, etc.
 */
export const Menubar: React.FC<MenubarProps> = ({
  editor,
  handleZoomIn,
  handleZoomOut,
  zoom,
  onInsertLink,
  onInsertImage,
}) => {
  // Small helper component for dropdown menu items with icons
  const MenuItemWithIcon = ({ 
    icon: Icon, 
    label, 
    onClick, 
    isActive = false,
    shortcut,
    disabled = false
  }: { 
    icon: React.ElementType;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    isActive?: boolean;
    shortcut?: string;
    disabled?: boolean;
  }) => (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className={isActive ? "bg-accent text-accent-foreground" : ""}
      disabled={disabled}
    >
      <Icon className="mr-2 h-4 w-4" />
      <span>{label}</span>
      {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
    </DropdownMenuItem>
  );

  return (
    <div className="flex items-center px-1.5 py-1 border-b bg-muted/20 gap-0.5">
      {/* FILE MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-sm font-normal">
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="flex items-center">
            <FileIcon className="mr-2 h-4 w-4" />
            File Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={FileIcon}
              label="New Document"
              onClick={() => console.log('New document')}
              shortcut="⌘N"
            />
            <MenuItemWithIcon
              icon={Save}
              label="Save"
              onClick={() => console.log('Save clicked!')}
              shortcut="⌘S"
            />
            <MenuItemWithIcon
              icon={RotateCcwIcon}
              label="Revert to Saved"
              onClick={() => console.log('Revert')}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={Undo2Icon}
              label="Undo"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              shortcut="⌘Z"
            />
            <MenuItemWithIcon
              icon={Redo2Icon}
              label="Redo"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              shortcut="⇧⌘Z"
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* EDIT MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-sm font-normal">
            Edit
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="flex items-center">
            <EditIcon className="mr-2 h-4 w-4" />
            Edit Options
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={PencilIcon}
              label="Select All"
              onClick={() => editor.chain().focus().selectAll().run()}
              shortcut="⌘A"
            />
            <MenuItemWithIcon
              icon={Type}
              label="Clear Formatting"
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={Palette}
              label="Text Color"
              onClick={() => console.log('Text color')}
            />
            <MenuItemWithIcon
              icon={HighlighterIcon}
              label="Highlight Color"
              onClick={() => console.log('Highlight color')}
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* FORMAT MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-sm font-normal">
            Format
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="flex items-center">
            <Type className="mr-2 h-4 w-4" />
            Styling & Alignment
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={BoldIcon}
              label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              shortcut="⌘B"
            />
            <MenuItemWithIcon
              icon={ItalicIcon}
              label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              shortcut="⌘I"
            />
            <MenuItemWithIcon
              icon={UnderlineIcon}
              label="Underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              shortcut="⌘U"
            />
            <MenuItemWithIcon
              icon={Strikethrough}
              label="Strikethrough"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={AlignLeftIcon}
              label="Align Left"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' }) as boolean}
            />
            <MenuItemWithIcon
              icon={AlignCenterIcon}
              label="Align Center"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' }) as boolean}
            />
            <MenuItemWithIcon
              icon={AlignRightIcon}
              label="Align Right"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' }) as boolean}
            />
            <MenuItemWithIcon
              icon={AlignJustifyIcon}
              label="Justify"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              isActive={editor.isActive({ textAlign: 'justify' }) as boolean}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={Heading1Icon}
              label="Heading 1"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
            />
            <MenuItemWithIcon
              icon={Heading2Icon}
              label="Heading 2"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
            />
            <MenuItemWithIcon
              icon={Heading3Icon}
              label="Heading 3"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <MenuItemWithIcon
            icon={CodeIcon}
            label="Code Block"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* LISTS MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-sm font-normal">
            Lists
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="flex items-center">
            <ListIcon className="mr-2 h-4 w-4" />
            List Types
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={ListIcon}
              label="Bullet List"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
            />
            <MenuItemWithIcon
              icon={ListOrderedIcon}
              label="Ordered List"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
            />
            <MenuItemWithIcon
              icon={SquareCheck}
              label="Task List"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive('taskList')}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={GripHorizontal}
              label="Indent"
              onClick={() => editor.chain().focus().indent().run()}
            />
            <MenuItemWithIcon
              icon={GripHorizontal}
              label="Outdent"
              onClick={() => editor.chain().focus().outdent().run()}
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* INSERT MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-sm font-normal">
            Insert
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Insert Elements
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {/* Insert Link */}
            <DropdownMenuItem asChild>
              <LinkButton editor={editor} />
            </DropdownMenuItem>
            
            {/* Insert Image */}
            <DropdownMenuItem asChild>
              <ImageButton editor={editor} />
            </DropdownMenuItem>
            
            {/* Table */}
            <MenuItemWithIcon
              icon={TableIcon}
              label="Table"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            />
            
            {/* Horizontal Rule */}
            <MenuItemWithIcon
              icon={MinusCircle}
              label="Horizontal Rule"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* VIEW MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-sm font-normal">
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="flex items-center">
            <EyeIcon className="mr-2 h-4 w-4" />
            View Options
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={MinusCircle}
              label="Zoom Out"
              onClick={handleZoomOut || (() => {})}
              shortcut="⌘-"
            />
            <MenuItemWithIcon
              icon={PlusCircle}
              label="Zoom In"
              onClick={handleZoomIn || (() => {})}
              shortcut="⌘+"
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="opacity-50">
            {zoom != null ? `${Math.round(zoom * 100)}%` : '100%'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <MenuItemWithIcon
              icon={PanelLeftIcon}
              label="Show Outline"
              onClick={() => console.log('Show outline')}
            />
            <MenuItemWithIcon
              icon={BookOpenIcon}
              label="Full Page View"
              onClick={() => console.log('Full page view')}
              shortcut="⌘⇧F"
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1"></div>

      {/* Quick access toolbar buttons */}
      <div className="flex items-center gap-0.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                <Undo2Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Undo (⌘Z)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                <Redo2Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Redo (⇧⌘Z)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <BoldIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Bold (⌘B)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <ItalicIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Italic (⌘I)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${editor.isActive('underline') ? 'bg-accent' : ''}`}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Underline (⌘U)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8">
              <HelpCircleIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Help</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <MenuItemWithIcon
              icon={CommandIcon}
              label="Keyboard Shortcuts"
              onClick={() => console.log('Keyboard shortcuts')}
            />
            <MenuItemWithIcon
              icon={Settings2Icon}
              label="Editor Settings"
              onClick={() => console.log('Editor settings')}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};