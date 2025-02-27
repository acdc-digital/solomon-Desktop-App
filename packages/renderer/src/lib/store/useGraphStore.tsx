// useGraphStore.ts
import create from 'zustand';

export interface EmbeddingChunk {
  id: string;
  pageContent: string;
  embedding: number[];
  metadata?: {
    keywords?: string[];
    topics?: string[];
    module?: string | null;
  };
  version: number;
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  significance?: number;
  version: number;
}

export interface GraphLink {
  source: string;
  target: string;
  similarity: number;
  relationship: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphStore {
  embeddings: EmbeddingChunk[];
  graphData: GraphData;
  setEmbeddings: (embeddings: EmbeddingChunk[]) => void;
  updateEmbeddings: (newEmbeddings: EmbeddingChunk[]) => void;
  setGraphData: (graphData: GraphData) => void;
  updateGraphLinks: (links: GraphLink[]) => void;
  updateGraphNodes: (nodes: GraphNode[]) => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  embeddings: [],
  graphData: { nodes: [], links: [] },
  setEmbeddings: (embeddings) => set({ embeddings }),
  updateEmbeddings: (newEmbeddings) => {
    const current = get().embeddings;
    const merged = new Map<string, EmbeddingChunk>();
    current.forEach((emb) => merged.set(emb.id, emb));
    newEmbeddings.forEach((newEmb) => {
      const existing = merged.get(newEmb.id);
      if (!existing || newEmb.version > existing.version) {
        merged.set(newEmb.id, newEmb);
      }
    });
    set({ embeddings: Array.from(merged.values()) });
  },
  setGraphData: (graphData) => set({ graphData }),
  updateGraphLinks: (links) => {
    set((state) => ({
      graphData: { ...state.graphData, links },
    }));
  },
  updateGraphNodes: (nodes) => {
    set((state) => ({
      graphData: { ...state.graphData, nodes },
    }));
  },
}));