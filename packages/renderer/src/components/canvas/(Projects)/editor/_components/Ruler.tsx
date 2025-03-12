// RULER
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Projects)/editor/_components/Ruler.tsx

// Ruler.tsx
import { useRef, useState, useEffect } from "react";
import { FaCaretDown } from "react-icons/fa";

// Create markers for ruler display
const markers = Array.from({ length: 96 }, (_, i) => i);

export const Ruler = () => {
    // Default margins (72px = 3/4 inch)
    const [leftMargin, setLeftMargin] = useState(72);
    const [rightMargin, setRightMargin] = useState(72);
    const [isDraggingLeft, setIsDraggingLeft] = useState(false);
    const [isDraggingRight, setIsDraggingRight] = useState(false);
    const rulerRef = useRef<HTMLDivElement>(null);

    // Get page width for the current page size (Letter)
    const pageWidth = 816; // Letter width in pixels

    // Update editor margins when ruler margins change
    useEffect(() => {
        // Find the editor element
        const editor = document.querySelector('.ProseMirror');
        if (editor) {
            // Update CSS variables
            (editor as HTMLElement).style.setProperty('--page-margin-left', `${leftMargin}px`);
            (editor as HTMLElement).style.setProperty('--page-margin-right', `${rightMargin}px`);
        }
    }, [leftMargin, rightMargin]);

    const handleLeftMouseDown = () => {
        setIsDraggingLeft(true);
    }

    const handleRightMouseDown = () => {
        setIsDraggingRight(true);
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if ((isDraggingLeft || isDraggingRight) && rulerRef.current) {
            const container = rulerRef.current.querySelector("#ruler-container");
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const relativeX = e.clientX - containerRect.left;
                
                // Ensure margin is within page bounds
                if (isDraggingLeft) {
                    // Minimum space for content (200px)
                    const maxLeftPosition = pageWidth - rightMargin - 100;
                    const newLeftPosition = Math.max(0, Math.min(maxLeftPosition, relativeX));
                    setLeftMargin(newLeftPosition);
                    
                    // Sync with editor
                    updateEditorMargins(newLeftPosition, rightMargin);
                } else if (isDraggingRight) {
                    // Calculate right margin from right edge
                    const newRightPosition = Math.max(0, pageWidth - relativeX);
                    
                    // Ensure there's at least 100px of content area
                    const maxRightPosition = pageWidth - (leftMargin + 100);
                    const constrainedRightPosition = Math.min(newRightPosition, maxRightPosition);
                    
                    setRightMargin(constrainedRightPosition);
                    
                    // Sync with editor
                    updateEditorMargins(leftMargin, constrainedRightPosition);
                }
            }
        }
    };

    // Update editor margins directly
    const updateEditorMargins = (left: number, right: number) => {
        const editor = document.querySelector('.ProseMirror');
        if (editor) {
            (editor as HTMLElement).style.setProperty('--page-margin-left', `${left}px`);
            (editor as HTMLElement).style.setProperty('--page-margin-right', `${right}px`);
        }
    };

    const handleMouseUp = () => {
        setIsDraggingLeft(false);
        setIsDraggingRight(false);
    };

    // Reset to default margins (72px = 3/4 inch)
    const handleLeftDoubleClick = () => {
        setLeftMargin(72);
        updateEditorMargins(72, rightMargin);
    };

    const handleRightDoubleClick = () => {
        setRightMargin(72);
        updateEditorMargins(leftMargin, 72);
    };

    return (
        <div 
            ref={rulerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="h-6 border-b border-gray-300 flex items-center justify-center relative select-none print:hidden"
        >
            <div
                id="ruler-container"
                className="w-[816px] h-full relative" // Fixed width to match page width
            >
                <Marker 
                    position={leftMargin}
                    isLeft={true}
                    isDragging={isDraggingLeft}
                    onMouseDown={handleLeftMouseDown}
                    onDoubleClick={handleLeftDoubleClick}
                />

                <Marker 
                    position={pageWidth - rightMargin}
                    isLeft={false}
                    isDragging={isDraggingRight}
                    onMouseDown={handleRightMouseDown}
                    onDoubleClick={handleRightDoubleClick}
                />
                
                <div className="absolute inset-x-0 bottom-0 h-full">
                    <div className="relative h-full w-full">
                        {markers.map((marker) => {
                            const position = (marker * pageWidth) / 95; // Adjusted for more accurate spacing

                            return (
                                <div
                                    key={marker}
                                    className="absolute bottom-0"
                                    style={{ left: `${position}px` }}
                                >
                                    {marker % 8 === 0 && (
                                        <>
                                            <div className="absolute bottom-0 w-[1px] h-2 bg-neutral-500" />
                                            <span className="absolute bottom-2 text-[10px] text-neutral-500 transform -translate-x-1/2">
                                                {marker / 8}
                                            </span>
                                        </>
                                    )}
                                    {marker % 8 === 4 && (
                                        <div className="absolute bottom-0 w-[1px] h-1.5 bg-neutral-500" />
                                    )}
                                    {marker % 8 !== 0 && marker % 8 !== 4 && (
                                        <div className="absolute bottom-0 w-[1px] h-1 bg-neutral-500" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MarkerProps {
    position: number;
    isLeft: boolean;
    isDragging: boolean;
    onMouseDown: () => void;
    onDoubleClick: () => void;
};

const Marker = ({
    position,
    isLeft,
    isDragging,
    onMouseDown,
    onDoubleClick,
}: MarkerProps) => {
    return (
        <div 
            className="absolute top-0 w-4 h-full cursor-ew-resize z-[5] group -ml-2"
            style={{ left: `${position}px` }}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick} 
        >
            <FaCaretDown 
                className="absolute left-1/2 top-0 h-full fill-blue-500 transform -translate-x-1/2"
            />
            <div
                className={`absolute left-1/2 top-4 transform -translate-x-1/2 h-screen ${isDragging ? 'block' : 'hidden'} custom-dashed-ruler`}
            ></div>
        </div>
    );
};