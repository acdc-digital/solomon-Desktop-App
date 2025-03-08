// Tiptap-pagination-breaks.d.ts
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/types/tiptap-pagination-breaks.d.ts

declare module 'tiptap-pagination-breaks' {
    import { Extension } from '@tiptap/core';
  
    export interface PaginationOptions {
      pageHeight?: number;
      pageWidth?: number;
      pageMargin?: number;
    }
  
    export const Pagination: Extension<PaginationOptions>;
  }