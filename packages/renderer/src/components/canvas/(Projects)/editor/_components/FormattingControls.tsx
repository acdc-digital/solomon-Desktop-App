// Editor Formatting Controls
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/Editor/_components/FormattingControls.tsx
// FormattingControls.tsx

import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Minus,
  Plus,
  ChevronDown,
  Highlighter,
  ListCollapse,
  Type,
  Palette,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  Button,
  buttonVariants,
} from '@/components/ui/button';

import { cn } from '@/lib/utils';
import { CompactPicker, type ColorResult } from 'react-color';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

/**
 * Props for the FormattingControls component
 */
interface FormattingControlsProps {
  editor: Editor;
}

/**
 * FormattingControls: A component that renders formatting controls for the TipTap editor
 */
export function FormattingControls({ editor }: FormattingControlsProps) {
  // ---------------------------------------------------------------------------
  // 1) Font Size Button with ShadCN UI styling
  // ---------------------------------------------------------------------------
  const FontSizeButton = () => {
    const currentFontSize = editor?.getAttributes('textStyle').fontSize
      ? editor.getAttributes('textStyle').fontSize.replace('px', '')
      : '16';

    const [fontSize, setFontSize] = useState(currentFontSize);
    const [inputValue, setInputValue] = useState(fontSize);
    const [isEditing, setIsEditing] = useState(false);

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
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        updateFontSize(inputValue);
      }
    };

    const increment = () => {
      const newSize = parseInt(fontSize) + 1;
      updateFontSize(newSize.toString());
    };

    const decrement = () => {
      const newSize = parseInt(fontSize) - 1;
      if (newSize > 0) {
        updateFontSize(newSize.toString());
      }
    };

    return (
      <div className="flex items-center gap-x-0.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onMouseDown={(e) => {
                  e.preventDefault();
                  decrement();
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Decrease Font Size</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isEditing ? (
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="h-8 w-12 text-sm text-center focus:ring-offset-0"
          />
        ) : (
          <Button
            variant="outline"
            className="h-8 px-2 text-xs font-normal w-12"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsEditing(true);
              setFontSize(currentFontSize);
            }}
          >
            {currentFontSize}
          </Button>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onMouseDown={(e) => {
                  e.preventDefault();
                  increment();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Increase Font Size</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 2) Font Family Button with ShadCN UI styling
  // ---------------------------------------------------------------------------
  const FontFamilyButton = () => {
    const fonts = [
      { label: 'Arial', value: 'Arial' },
      { label: 'Times New Roman', value: 'Times New Roman' },
      { label: 'Courier New', value: 'Courier New' },
      { label: 'Georgia', value: 'Georgia' },
      { label: 'Verdana', value: 'Verdana' },
      { label: 'Helvetica', value: 'Helvetica' },
    ];

    const currentFont = editor?.getAttributes('textStyle').fontFamily || 'Arial';

    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="h-8 w-[140px] justify-between font-normal"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className="truncate" style={{ fontFamily: currentFont }}>
                    {currentFont}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Font Family</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent className="w-[140px]" align="start">
          <DropdownMenuLabel>Font Family</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {fonts.map(({ label, value }) => (
            <DropdownMenuItem
              key={value}
              onSelect={(e) => {
                e.preventDefault();
                editor?.chain().focus().setFontFamily(value).run();
              }}
              className={cn(
                editor?.getAttributes('textStyle').fontFamily === value
                  ? 'bg-accent text-accent-foreground'
                  : ''
              )}
              style={{ fontFamily: value }}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // ---------------------------------------------------------------------------
  // 3) Text Color Button with ShadCN UI styling
  // ---------------------------------------------------------------------------
  const TextColorButton = () => {
    const value = editor?.getAttributes('textStyle').color || '#000000';

    const onChange = (color: ColorResult) => {
      editor?.chain().focus().setColor(color.hex).run();
    };

    return (
      <Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 relative"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Type className="h-4 w-4" />
                  <div 
                    className="absolute bottom-1 left-1 right-1 h-1 rounded-sm" 
                    style={{ backgroundColor: value }} 
                  />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Text Color</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <PopoverContent 
          className="w-auto p-2" 
          onMouseDown={(e) => e.preventDefault()}
          sideOffset={5}
        >
          <CompactPicker color={value} onChange={onChange} />
        </PopoverContent>
      </Popover>
    );
  };

  // ---------------------------------------------------------------------------
  // 4) Highlight Color Button with ShadCN UI styling
  // ---------------------------------------------------------------------------
  const HighlightColorButton = () => {
    const value = editor?.getAttributes('highlight').color || '#FFFF00';

    const onChange = (color: ColorResult) => {
      editor?.chain().focus().setHighlight({ color: color.hex }).run();
    };

    return (
      <Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 relative"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Highlighter className="h-4 w-4" />
                  <div 
                    className="absolute bottom-1 left-1 right-1 h-1 rounded-sm" 
                    style={{ backgroundColor: value }} 
                  />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Highlight Color</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <PopoverContent 
          className="w-auto p-2" 
          onMouseDown={(e) => e.preventDefault()}
          sideOffset={5}
        >
          <CompactPicker color={value} onChange={onChange} />
        </PopoverContent>
      </Popover>
    );
  };

  // ---------------------------------------------------------------------------
  // 5) Line Height Button with ShadCN UI styling
  // ---------------------------------------------------------------------------
  const LineHeightButton = () => {
    const lineHeights = [
      { label: 'Default', value: 'normal' },
      { label: 'Single', value: '1' },
      { label: '1.15', value: '1.15' },
      { label: '1.5', value: '1.5' },
      { label: 'Double', value: '2' },
    ];

    const currentLineHeight = editor?.getAttributes('paragraph').lineHeight || 'normal';

    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <ListCollapse className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Line Height</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent align="start" className="w-[140px]">
          <DropdownMenuLabel>Line Height</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {lineHeights.map(({ label, value }) => (
            <DropdownMenuItem
              key={value}
              onSelect={(e) => {
                e.preventDefault();
                editor?.chain().focus().setLineHeight(value).run();
              }}
              className={cn(
                currentLineHeight === value 
                  ? 'bg-accent text-accent-foreground' 
                  : ''
              )}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // ---------------------------------------------------------------------------
  // Return the grouped UI with modern ShadCN styling
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-wrap items-center px-1.5 py-1 gap-1">
      <FontFamilyButton />
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <FontSizeButton />
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <TextColorButton />
      <HighlightColorButton />
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <LineHeightButton />
    </div>
  );
}