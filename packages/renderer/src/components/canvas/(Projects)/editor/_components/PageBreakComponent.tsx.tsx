// PageBreakComponent.tsx
// File path: /Users/matthewsimon/Documents/github/solomon-electron/solomon-electron/next/src/components/canvas/(Projects)/_components/PageBreak.tsx

import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

interface PageBreakProps {
  node?: {
    attrs?: {
      pageNumber?: number;
    };
  };
  updateAttributes?: (attrs: Record<string, any>) => void;
}

// React component for the page break node view
const PageBreakComponent: React.FC<PageBreakProps> = ({ node, updateAttributes }) => {
  const pageNumber = node?.attrs?.pageNumber || 'Next';
  
  return (
    <NodeViewWrapper className="page-break-wrapper">
      <div 
        className="page-break relative w-full my-6 border-t-2 border-dashed border-blue-400" 
        contentEditable={false} 
        data-type="pageBreak"
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full border border-blue-400">
          <span className="page-break-label text-sm font-medium text-blue-600">
            Page Break
          </span>
        </div>
      </div>
      <NodeViewContent className="hidden" />
    </NodeViewWrapper>
  );
};

export default PageBreakComponent;