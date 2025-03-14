// GRAPH STORE
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/lib/store/graphStore.tsx

// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/lib/store/graphStore.tsx

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GraphNode, GraphLink, SimulationSettings } from '@/components/canvas/(Admin)/graph/_components/GraphCanvas';
import { produce } from 'immer';

// Define visualization history state for undo/redo
export interface GraphHistoryState {
  pastStates: Array<{
    nodes: GraphNode[];
    links: GraphLink[];
    timestamp: number;
  }>;
  futureStates: Array<{
    nodes: GraphNode[];
    links: GraphLink[];
    timestamp: number;
  }>;
  currentStateIndex: number;
}

// Define zoom state interface
export interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

// Node selection state
export interface SelectionState {
  selectedNode: GraphNode | null;
  hoveredNode: GraphNode | null;
}

// Enhanced graph state interface
interface GraphState {
  // Core data
  embeddings: any[];
  graphData: { nodes: GraphNode[]; links: GraphLink[] } | null;
  
  // UI states
  simulationSettings: SimulationSettings;
  zoomState: ZoomState;
  selectionState: SelectionState;
  isProcessing: boolean;
  
  // History for undo/redo
  history: GraphHistoryState;
  
  // Actions for data management
  setGraphData: (data: { nodes: GraphNode[]; links: GraphLink[] }) => void;
  updateGraphNodes: (nodes: GraphNode[]) => void;
  updateGraphLinks: (links: GraphLink[]) => void;
  mergeGraphData: (data: { nodes?: GraphNode[]; links?: GraphLink[] }) => void;
  
  // Actions for selection
  setSelectedNode: (node: GraphNode | null) => void;
  setHoveredNode: (node: GraphNode | null) => void;
  
  // Actions for UI state
  updateSimulationSettings: (settings: Partial<SimulationSettings>) => void;
  updateZoomState: (zoomState: ZoomState) => void;
  setProcessing: (isProcessing: boolean) => void;
  
  // History management
  pushStateToHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Reset actions
  resetGraph: () => void;
  resetZoom: () => void;
  resetAll: () => void;
}

// Initial states
const initialSimulationSettings: SimulationSettings = {
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
  translateY: 0,
};

const initialSelectionState: SelectionState = {
  selectedNode: null,
  hoveredNode: null,
};

const initialHistoryState: GraphHistoryState = {
  pastStates: [],
  futureStates: [],
  currentStateIndex: -1,
};

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      // Core state
      embeddings: [],
      graphData: null,
      simulationSettings: initialSimulationSettings,
      zoomState: initialZoomState,
      selectionState: initialSelectionState,
      isProcessing: false,
      history: initialHistoryState,
      
      // Data management actions
      setGraphData: (data) => {
        set((state) => {
          // Before updating, push current graph state to history (if exists)
          if (state.graphData) {
            state.history.pastStates.push({
              nodes: state.graphData.nodes || [],
              links: state.graphData.links || [],
              timestamp: Date.now()
            });
            // Limit history size to last 20 states
            if (state.history.pastStates.length > 20) {
              state.history.pastStates.shift();
            }
            // Clear future states when a new change is made
            state.history.futureStates = [];
          }
          return {
            graphData: data,
            history: { ...state.history, futureStates: [] }
          };
        });
      },
      
      updateGraphNodes: (nodes) =>
        set((state) => ({
          graphData: state.graphData ? { ...state.graphData, nodes } : { nodes, links: [] }
        })),
      
      updateGraphLinks: (links) =>
        set((state) => ({
          graphData: state.graphData ? { ...state.graphData, links } : { nodes: [], links }
        })),
        
      mergeGraphData: (data) =>
        set((state) => {
          if (!state.graphData) {
            return { graphData: { nodes: data.nodes || [], links: data.links || [] } };
          }
          const mergedNodes = data.nodes 
            ? [...state.graphData.nodes, ...data.nodes]
            : state.graphData.nodes;
          const mergedLinks = data.links 
            ? [...state.graphData.links, ...data.links]
            : state.graphData.links;
          
          // Deduplicate nodes based on ID.
          const uniqueNodeIds = new Set<string>();
          const uniqueNodes = mergedNodes.filter(node => {
            if (uniqueNodeIds.has(node.id)) {
              return false;
            }
            uniqueNodeIds.add(node.id);
            return true;
          });
          
          // Deduplicate links based on a key constructed from source and target IDs.
          const uniqueLinks = mergedLinks.filter((link, index, self) => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            const linkKey = `${sourceId}-${targetId}`;
            return index === self.findIndex(l => {
              const lSourceId = typeof l.source === 'string' ? l.source : l.source.id;
              const lTargetId = typeof l.target === 'string' ? l.target : l.target.id;
              return `${lSourceId}-${lTargetId}` === linkKey;
            });
          });
          
          return { graphData: { nodes: uniqueNodes, links: uniqueLinks } };
        }),
      
      // Selection state actions
      setSelectedNode: (node) =>
        set((state) => ({
          selectionState: { ...state.selectionState, selectedNode: node }
        })),
        
      setHoveredNode: (node) =>
        set((state) => ({
          selectionState: { ...state.selectionState, hoveredNode: node }
        })),
      
      // UI state actions
      updateSimulationSettings: (settings) =>
        set((state) => ({
          simulationSettings: { ...state.simulationSettings, ...settings }
        })),
      
      updateZoomState: (zoomState) => set({ zoomState }),
      
      setProcessing: (isProcessing) => set({ isProcessing }),
      
      // History management actions
      pushStateToHistory: () => {
        const { graphData, history } = get();
        if (!graphData) return;
        set((state) => ({
          history: {
            pastStates: [
              ...state.history.pastStates,
              {
                nodes: state.graphData?.nodes || [],
                links: state.graphData?.links || [],
                timestamp: Date.now()
              }
            ].slice(-20), // Keep only the last 20 states.
            futureStates: [],
            currentStateIndex: state.history.pastStates.length
          }
        }));
      },
      
      undo: () => {
        const { history, graphData } = get();
        if (history.pastStates.length === 0) return;
        const lastPastState = history.pastStates[history.pastStates.length - 1];
        const newPastStates = history.pastStates.slice(0, -1);
        set({
          graphData: { nodes: lastPastState.nodes, links: lastPastState.links },
          history: {
            pastStates: newPastStates,
            futureStates: [
              {
                nodes: graphData?.nodes || [],
                links: graphData?.links || [],
                timestamp: Date.now()
              },
              ...history.futureStates
            ],
            currentStateIndex: history.currentStateIndex - 1
          }
        });
      },
      
      redo: () => {
        const { history, graphData } = get();
        if (history.futureStates.length === 0) return;
        const nextFutureState = history.futureStates[0];
        const newFutureStates = history.futureStates.slice(1);
        set({
          graphData: { nodes: nextFutureState.nodes, links: nextFutureState.links },
          history: {
            pastStates: [
              ...history.pastStates,
              {
                nodes: graphData?.nodes || [],
                links: graphData?.links || [],
                timestamp: Date.now()
              }
            ],
            futureStates: newFutureStates,
            currentStateIndex: history.currentStateIndex + 1
          }
        });
      },
      
      // Reset actions
      resetGraph: () =>
        set({
          graphData: null,
          simulationSettings: initialSimulationSettings
          // Note: Zoom state is preserved to maintain current view.
        }),
      
      resetZoom: () =>
        set({ zoomState: initialZoomState }),
      
      resetAll: () =>
        set({
          graphData: null,
          simulationSettings: initialSimulationSettings,
          zoomState: initialZoomState,
          selectionState: initialSelectionState,
          history: initialHistoryState
        })
    }),
    {
      name: 'solomon-graph-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only a subset to avoid bloating local storage.
        graphData: state.graphData
          ? {
              nodes: state.graphData.nodes.slice(0, 1000),
              links: state.graphData.links.slice(0, 3000)
            }
          : null,
        simulationSettings: state.simulationSettings,
        zoomState: state.zoomState
      })
    }
  )
);