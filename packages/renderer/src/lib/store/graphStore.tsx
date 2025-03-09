// graphStore.ts
import { create } from 'zustand';
import { api } from '../../../convex/_generated/api';
import { useEffect } from 'react';

// Types for embeddings
export interface EmbeddingChunk {
  id: string;
  content?: string;
  embedding: number[];
  metadata?: {
    title?: string;
    topics?: string[];
    keywords?: string[];
    category?: string;
    importance?: number;
    [key: string]: any;
  };
  version?: number;
}

// Types for graph data
export interface GraphNode {
  id: string;
  documentChunkId?: string;
  label: string;
  group: string;
  significance?: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
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

interface GraphState {
  // Embeddings data
  embeddings: EmbeddingChunk[];
  updateEmbeddings: (chunks: EmbeddingChunk[]) => void;
  addEmbedding: (chunk: EmbeddingChunk) => void;
  
  // Graph data
  graphData: GraphData;
  setGraphData: (data: GraphData) => void;
  updateGraphNodes: (nodes: GraphNode[]) => void;
  updateGraphLinks: (links: GraphLink[]) => void;
  
  // UI state management
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  
  // Utility functions
  getSelectedNode: () => GraphNode | null;
  getNodeConnections: (nodeId: string) => {
    connectedNodes: GraphNode[];
    links: GraphLink[];
  };
}

export const useGraphStore = create<GraphState>((set, get) => ({
  // Embeddings management
  embeddings: [],
  updateEmbeddings: (chunks) => set({ embeddings: chunks }),
  addEmbedding: (chunk) => set((state) => ({ 
    embeddings: [...state.embeddings, chunk] 
  })),
  
  // Graph data management
  graphData: { nodes: [], links: [] },
  setGraphData: (data) => set({ graphData: data }),
  updateGraphNodes: (nodes) => set((state) => ({
    graphData: {
      ...state.graphData,
      nodes
    }
  })),
  updateGraphLinks: (links) => set((state) => ({
    graphData: {
      ...state.graphData,
      links
    }
  })),
  
  // UI state
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  
  // Utility functions
  getSelectedNode: () => {
    const state = get();
    if (!state.selectedNodeId) return null;
    return state.graphData.nodes.find(node => node.id === state.selectedNodeId) || null;
  },
  
  getNodeConnections: (nodeId) => {
    const state = get();
    const connectedLinks = state.graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      return sourceId === nodeId || targetId === nodeId;
    });
    
    const connectedNodeIds = new Set<string>();
    
    connectedLinks.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      
      if (sourceId !== nodeId) connectedNodeIds.add(sourceId);
      if (targetId !== nodeId) connectedNodeIds.add(targetId);
    });
    
    const connectedNodes = state.graphData.nodes.filter(node => 
      connectedNodeIds.has(node.id)
    );
    
    return {
      connectedNodes,
      links: connectedLinks
    };
  }
}));

// Utility hook to load graph data from Convex
export const useLoadGraphData = () => {
  const { setGraphData } = useGraphStore();
  const graphData = useQuery(api.graph.getGraphData);
  
  useEffect(() => {
    if (graphData && (graphData.nodes?.length || graphData.links?.length)) {
      // Transform to our internal format
      const nodes = graphData.nodes.map(node => ({
        id: node.documentChunkId,
        documentChunkId: node.documentChunkId,
        label: node.label,
        group: node.group,
        significance: node.significance || 1
      }));
      
      const links = graphData.links.map(link => ({
        source: link.source,
        target: link.target,
        similarity: link.similarity,
        relationship: link.relationship
      }));
      
      setGraphData({ nodes, links });
    }
  }, [graphData, setGraphData]);
};

// Utility function to calculate cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be of the same length.");
  }

  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * (vecB[idx] || 0), 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}