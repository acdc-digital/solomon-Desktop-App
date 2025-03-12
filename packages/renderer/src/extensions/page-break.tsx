// PageBreak Extension for TipTap
// File path: /Users/matthewsimon/Documents/github/solomon-electron/solomon-electron/next/src/extensions/page-break.tsx

// Page Break Extension for TipTap
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import PageBreakComponent from '@/components/canvas/(Projects)/editor/_components/PageBreakComponent.tsx';

export const PageBreak = Node.create({
  name: 'pageBreak',
  
  // Define element mapping for the node
  group: 'block',
  selectable: true,
  draggable: false,
  
  parseHTML() {
    return [
      { tag: 'div[data-type="pageBreak"]' },
      { tag: 'div.page-break' },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    // Add necessary attributes for HTML rendering
    return ['div', mergeAttributes(HTMLAttributes, {
      'class': 'page-break',
      'data-type': 'pageBreak',
      'contenteditable': 'false'
    }), ['span', { class: 'page-break-label' }, 'Page Break']];
  },
  
  addNodeView() {
    // Use React NodeView for better rendering
    return ReactNodeViewRenderer(PageBreakComponent);
  },
  
  addCommands() {
    return {
      insertPageBreak: () => ({ chain }) => {
        // Insert a page break at the current position and create a new paragraph
        return chain()
          .insertContent({ type: this.name })
          // Move to the next paragraph after the page break
          .insertContent({ type: 'paragraph' })
          .run();
      },
    };
  },
  
  // Add keyboard shortcuts for inserting page breaks
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.insertPageBreak(),
    };
  },
});

export default PageBreak;