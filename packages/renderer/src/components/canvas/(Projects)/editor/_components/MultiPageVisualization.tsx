// MULTI-PAGE HANDLER
// MultiPageVisualization.tsx

import React, { forwardRef, useEffect, useState, useRef } from 'react';

interface PageVisualizationProps {
  pageSize: string;
  zoom: number;
  children?: React.ReactNode;
  content?: string;
  editor?: any; // TipTap editor instance
}

const MultiPageVisualization = forwardRef<HTMLDivElement, PageVisualizationProps>(({
  pageSize = 'Letter',
  zoom,
  children,
  content,
  editor,
}, ref) => {
  const [pageCount, setPageCount] = useState(1);
  const [pageBreakPositions, setPageBreakPositions] = useState<number[]>([]);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Base dimensions in px (at 96 DPI for web)
  const dimensions = (() => {
    switch(pageSize) {
      case 'A4': return { width: 595, height: 842 };
      case 'Letter': return { width: 816, height: 1056 };
      case 'Legal': return { width: 612, height: 1008 };
      case 'A3': return { width: 842, height: 1191 };
      case 'Tabloid': return { width: 792, height: 1224 };
      default: return { width: 612, height: 792 }; // Default to Letter
    }
  })();
  
  // Standard margin (1 inch = 96px)
  const margin = 24;
  
  // Update page count when content changes
  useEffect(() => {
    if (!content) {
      setPageCount(1);
      return;
    }
    
    // Count page breaks to determine page count
    const pageBreakMatches = content.match(/<div class="page-break"/g) || [];
    const breakCount = pageBreakMatches.length;
    setPageCount(breakCount + 1);
    
    // Find positions of page breaks in the document
    if (editor) {
      const positions: number[] = [];
      editor.state.doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'pageBreak') {
          positions.push(pos);
        }
        return true;
      });
      setPageBreakPositions(positions);
    }
  }, [content, editor]);
  
  // Create the array of page indices
  const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
  
  // Forward the first page's ref to the parent component if needed
  const firstPageRef = (el: HTMLDivElement) => {
    if (ref && typeof ref === 'function') {
      ref(el);
    } else if (ref) {
      ref.current = el;
    }
  };
  
  return (
    <div 
      className="page-container pt-4"
      ref={pagesContainerRef}
    >
      {pageIndices.map((pageIndex) => (
        <div key={pageIndex} className="flex flex-col items-center w-full">
          <div
            ref={pageIndex === 0 ? firstPageRef : undefined}
            className={`page relative bg-white shadow-md ${pageIndex === 0 ? 'first-page' : ''}`}
            style={{
              width: dimensions.width,
              minHeight: dimensions.height,
              transformOrigin: 'top center',
              transform: `scale(${zoom})`,
              marginBottom: pageIndex < pageCount - 1 ? '40px' : '20px',
              padding: `${margin}px`,
              boxSizing: 'border-box',
              border: '1px solid #e2e8f0'
            }}
            data-page={pageIndex + 1}
          >
            {/* We render the actual editor content only on the first page */}
            {pageIndex === 0 && children}
            
            {/* Page number indicator in top right corner */}
            <div 
              className="page-number absolute text-xs text-gray-500"
              style={{
                top: '4px',
                right: '8px'
              }}
            >
              Page {pageIndex + 1} of {pageCount}
            </div>
          </div>
          
          {/* Visual page separator only between pages, not after the last one */}
          {pageIndex < pageCount - 1 && (
            <div className="page-separator flex items-center justify-center w-full py-1">
              <div className="flex flex-col items-center">
                <div className="w-64 border-t border-dashed border-gray-400 mb-1"></div>
                <span className="text-xs text-gray-500">Page {pageIndex + 1} End • Page {pageIndex + 2} Start</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

MultiPageVisualization.displayName = 'MultiPageVisualization';

export default MultiPageVisualization;