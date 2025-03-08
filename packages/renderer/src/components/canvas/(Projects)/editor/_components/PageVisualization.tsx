// Page Visualization
// /Users/matthewsimon/Documents/github/solomon-electron/solomon-electron/next/src/components/canvas/(Projects)/_components/PageVisualization.tsx

import React, { forwardRef } from 'react';

interface PageVisualizationProps {
  pageSize: string;
  pageMargin?: string;
  zoom: number;
  children?: React.ReactNode;
  content?: string;
}

const PageVisualization = forwardRef<HTMLDivElement, PageVisualizationProps>(({
  pageSize,
  pageMargin = '0px',
  zoom,
  children,
  content,
}, ref) => {
  // Base dimensions in px (at ~72 DPI)
  const dimensions = (() => {
    switch(pageSize) {
      case 'A4': return { width: 595, height: 842 };
      case 'Letter': return { width: 612, height: 792 };
      case 'Legal': return { width: 612, height: 1008 };
      case 'A3': return { width: 842, height: 1191 };
      case 'Tabloid': return { width: 792, height: 1224 };
      default: return { width: 595, height: 842 }; // Default to A4
    }
  })();

  return (
    <div
      className="flex justify-center items-start w-full"
      style={{
        padding: pageMargin,
      }}
    >
      <div
        ref={ref}
        className="bg-white border border-gray-300 shadow-md"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          transformOrigin: 'top center',
          transform: `scale(${zoom})`,
          marginBottom: '40px', // Add space at the bottom
        }}
      >
        <div className="w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
});

PageVisualization.displayName = 'PageVisualization';

export default PageVisualization;