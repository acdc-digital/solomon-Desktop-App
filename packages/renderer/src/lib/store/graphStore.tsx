// /packages/renderer/src/lib/store/graphStore.ts
// /packages/renderer/src/lib/store/graphStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GraphNode, GraphLink, SimulationSettings } from '@/components/canvas/(Admin)/graph/_components/GraphCanvas'; // Import types

// Define zoom state interface
export interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

interface GraphState {
  embeddings: any[]; // You might want a more specific type here
  graphData: { nodes: GraphNode[]; links: GraphLink[] } | null;
  simulationSettings: SimulationSettings;
  zoomState: ZoomState | null; // Add zoom state
  setGraphData: (data: { nodes: GraphNode[]; links: GraphLink[] }) => void;
  updateGraphNodes: (nodes: GraphNode[]) => void;
  updateGraphLinks: (links: GraphLink[]) => void;
  updateSimulationSettings: (settings: Partial<SimulationSettings>) => void;
  updateZoomState: (zoomState: ZoomState) => void; // Add update function for zoom
  resetGraph: () => void; // For clearing the state
  resetZoom: () => void; // For resetting just the zoom
}

const initialSimulationSettings: SimulationSettings = { // Defining the initial state
  linkDistance: 100,
  forceManyBody: -300,
  collisionRadius: 30,
  similarityThreshold: 0.5,
  showLabels: true,
  nodeGroupFilter: 'all',
};

const initialZoomState: ZoomState = {
  scale: 1,
  translateX: 0,
  translateY: 0
};

export const useGraphStore = create<GraphState>()(
  persist(
    (set) => ({
      embeddings: [],
      graphData: null,
      simulationSettings: initialSimulationSettings,
      zoomState: initialZoomState,
      
      setGraphData: (data) => set({ graphData: data }),
      
      updateGraphNodes: (nodes) =>
        set((state) => ({
          graphData: state.graphData ? { ...state.graphData, nodes } : { nodes, links: [] },
        })),
      
      updateGraphLinks: (links) =>
        set((state) => ({
          graphData: state.graphData ? { ...state.graphData, links } : { nodes: [], links },
        })),
      
      updateSimulationSettings: (settings) =>
        set((state) => ({
          simulationSettings: { ...state.simulationSettings, ...settings },
        })),
      
      // Add zoom state update function
      updateZoomState: (zoomState) => 
        set({ zoomState }),
      
      resetGraph: () => set({ 
        graphData: null, 
        simulationSettings: initialSimulationSettings,
        // Note: We don't reset zoom here to maintain view when resetting the graph
      }), 
      
      // Add function to reset only the zoom
      resetZoom: () => set({ 
        zoomState: initialZoomState 
      })
    }),
    {
      name: 'solomon-graph-storage', // Storage key for localStorage
      partialize: (state) => ({
        // Only persist these parts of the state
        graphData: state.graphData,
        simulationSettings: state.simulationSettings,
        zoomState: state.zoomState
      })
    }
  )
);