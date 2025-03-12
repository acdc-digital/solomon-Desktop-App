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
                contentHeight = pageHeight - 96; // Default 48px * 2
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
  // For text nodes, calculate based on actual font size
  if (node.isText) {
    const text = node.text || '';
    const lines = text.split('\n').length;
    // Use font size 14px × line height 1.15
    return Math.max(1, lines) * 16 * 1.15; // 16px font × 1.15 line height
  }
  
  // For paragraphs, add extra spacing
  if (node.type?.name === 'paragraph') {
    let height = 0;
    if (node.content?.size > 0) {
      node.content.forEach((child: any) => {
        height += calculateNodeHeight(child);
      });
    }
    return height > 0 ? height : 16 * 1.15; // Min height for empty paragraph
  }
  
  // For headings, use larger font sizes
  if (node.type?.name === 'heading') {
    const level = node.attrs?.level || 1;
    const fontSizeMap = { 1: 24, 2: 20, 3: 18 }; // Font sizes by heading level
    const fontSize = fontSizeMap[level] || 16;
    return fontSize * 1.2; // Add extra space for headings
  }
  
  // Handle other block elements with reasonable heights
  let height = 16; // Base height for block elements
  
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