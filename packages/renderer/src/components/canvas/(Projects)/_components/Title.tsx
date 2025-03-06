// Project Title
// /Users/matthewsimon/Documents/github/solomon-electron/solomon-electron/next/src/components/canvas/(Projects)/_components/Title.tsx

'use client';

import { useMutation } from "convex/react";
import { Doc } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

interface TitleProps {
    initialData: Doc<"projects">;
};

export const Title = ({
    initialData
}: TitleProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const update = useMutation(api.projects.update);

    const [title, setTitle] = useState(initialData.title || "Untitled");
    const [isEditing, setIsEditing] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const enableInput = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent the default behavior which would select the text
        e.preventDefault();
        
        setTitle(initialData.title || "Untitled");
        setIsEditing(true);
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
        }, 0);
    };

    const disableInput = () => {
        setIsEditing(false);
    };

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
        update({
            id: initialData._id,
            title: event.target.value || "Untitled"
        });
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            disableInput();
        }
    };

    return (
        <div>
            {isEditing ? (
                <Input 
                    ref={inputRef}
                    onChange={onChange}
                    onBlur={disableInput}
                    onKeyDown={onKeyDown}
                    value={title}
                    className="h-6 px-0 border-none bg-transparent focus-visible:ring-0 shadow-none text-sm font-medium"
                    autoFocus
                />
            ) : (
                <div 
                    onClick={enableInput}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    className="flex items-center gap-2 cursor-text"
                >
                    <span className="text-sm font-medium truncate">
                        {initialData?.title || "Untitled"}
                    </span>
                    {isHovering && (
                        <Pencil className="h-3 w-3 text-gray-400" />
                    )}
                </div>
            )}
        </div>
    );
};