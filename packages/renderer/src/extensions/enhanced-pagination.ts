// PAGINATION
// /Users/matthewsimon/Documents/github/solomon-electron/solomon-electron/next/src/extensions/enhanced-pagination.ts

// Enhanced Pagination Extension
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

interface PaginationOptions {
  pageHeight: number;
  pageWidth: number;
  pageMargin: number | {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showDecorations?: boolean;
}

export const EnhancedPagination = Extension.create<PaginationOptions>({
  name: 'enhancedPagination',

  addOptions() {
    return {
      pageHeight: 792, // Default Letter height
      pageWidth: 612,  // Default Letter width
      pageMargin: 96, // 1 inch in pixels (96 PPI)
      showDecorations: true,
    };
  },

  addProseMirrorPlugins() {
    const { pageHeight, pageMargin, showDecorations } = this.options;

    // If showDecorations is false, don't add any decorations
    if (!showDecorations) {
      return [];
    }

    return [
      new Plugin({
        key: new PluginKey('enhancedPagination'),
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: Decoration[] = [];
            
            // Track page positions
            let currentHeight = 0;
            let pageNumber = 1;
            let pageBreaks: number[] = [];

            // Find positions where page breaks should appear
            doc.descendants((node, pos) => {
              // If there's a manual page break, reset height counter
              if (node.type.name === 'pageBreak') {
                pageBreaks.push(pos);
                currentHeight = 0;
                pageNumber++;
                return false;
              }

              // Skip if node is a decoration
              if (node.type.name === 'decoration') return false;

              // Calculate node height (in a real implementation, use getBoundingClientRect)
              const nodeHeight = calculateNodeHeight(node);
              currentHeight += nodeHeight;

              // If content exceeds page height, insert automatic page break
              let contentHeight;
              
              if (typeof pageMargin === 'number') {
                // If pageMargin is a single number, apply it to all sides
                contentHeight = pageHeight - (pageMargin * 2); // Top and bottom margins
              } else if (pageMargin && typeof pageMargin === 'object') {
                // If pageMargin is an object with top/bottom properties
                contentHeight = pageHeight - ((pageMargin.top || 0) + (pageMargin.bottom || 0));
              } else {
                // Default fallback if pageMargin is undefined
                contentHeight = pageHeight - 192; // Default 96px * 2
              }
              
              if (currentHeight > contentHeight) {
                pageBreaks.push(pos);
                currentHeight = nodeHeight; // Reset with current node on new page
                pageNumber++;
              }

              return true;
            });

            // Create decorations for each page break
            pageBreaks.forEach((pos, index) => {
              decorations.push(
                Decoration.widget(pos, () => {
                  const pageBreak = document.createElement('div');
                  pageBreak.className = 'page-break';
                  pageBreak.setAttribute('data-page-number', `${index + 2}`); // +2 because it's the start of the next page
                  pageBreak.setAttribute('contenteditable', 'false');
                  
                  const label = document.createElement('span');
                  label.textContent = `Page ${index + 2}`;
                  label.className = 'page-break-label';
                  pageBreak.appendChild(label);
                  
                  return pageBreak;
                })
              );
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      setPaginationOptions: (options: Partial<PaginationOptions>) => ({ commands }) => {
        // Update options
        this.options = { ...this.options, ...options };
        
        // Force a re-render
        return commands.insertContent(' ') && commands.deleteSelection();
      },
      
      insertPageBreak: () => ({ commands }) => {
        // Insert a manual page break
        return commands.insertContent({
          type: 'pageBreak'
        });
      },
    };
  },
});

// Helper function to calculate approximate node height
function calculateNodeHeight(node: any): number {
  // This is a simplified calculation - in production you'd need DOM measurement
  if (node.isText) {
    // Approximate text height
    const lines = node.text?.split('\n').length || 1;
    return lines * 20; // Assume 20px per line
  }
  
  // For blocks, use a base height plus child heights
  let height = 30; // Base height for block elements
  
  if (node.content && node.content.size > 0) {
    node.content.forEach((child: any) => {
      height += calculateNodeHeight(child);
    });
  }
  
  return height;
}

// Export a function that returns the combined extension
export const EnhancedPaginationExtension = (options: Partial<PaginationOptions> = {}) => {
  return EnhancedPagination.configure({
    ...options,
  });
};

export default EnhancedPaginationExtension;