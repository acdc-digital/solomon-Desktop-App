// Graph-UI
// /Users/matthewsimon/Documents/Github/solomon-desktop/solomon-Desktop/next/src/components/canvas/(Admin)/_components/EmbeddingGraph.tsx

'use client';

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useWindowSize } from "@react-hook/window-size";
import { 
  useGraphStore, 
  EmbeddingChunk, 
  GraphData, 
  GraphLink 
} from "@/lib/store/useGraphStore";

// Fix the dynamic import to ensure it returns a component
// Make sure to correctly handle the default export
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <div>Loading 3D Graph...</div>
  }
);

interface CameraState {
  position: { x: number; y: number; z: number };
}

interface ForceGraph3DInstance {
  refresh?: () => void;
  zoomToFit?: (ms?: number, padding?: number, nodeFilterFn?: (node: any) => boolean) => void;
  cameraPosition?: (position: CameraState, lookAt?: { x: number; y: number; z: number }, transitionDuration?: number) => void;
  _renderer?: { domElement?: HTMLCanvasElement };
  controls?: () => any;
  scene?: () => any;
  camera?: () => any;
  d3Force?: (forceName: string, forceInstance: any) => any;
}

const topK = 5;
const INITIAL_LIMIT = 100;

const EmbeddingGraph: React.FC = () => {
  // Get store methods and state
  const {
    embeddings,
    updateEmbeddings,
    graphData,
    setGraphData,
    updateGraphLinks,
    updateGraphNodes,
  } = useGraphStore();
  
  const [width, height] = useWindowSize();
  const instanceRef = useRef<ForceGraph3DInstance | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Debug state
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  
  // Pagination state
  const [limit, setLimit] = useState<number>(INITIAL_LIMIT);
  const [cursor, setCursor] = useState<string | null>(null);

  // Node colors for styling
  const nodeColors = {
    "AI": "#4f46e5",      // Indigo
    "Knowledge": "#10b981", // Emerald
    "Language": "#f59e0b",  // Amber
    "Technology": "#ef4444", // Red
    "default": "#6b7280"    // Gray
  };

  // Fetch embeddings from Convex
  const data = useQuery(api.chunks.getAllEmbeddings, { limit, cursor });
  const batchUpsertGraphNodes = useMutation(api.graph.batchUpsertGraphNodes);

  // Log Convex data and update embeddings state
  useEffect(() => {
    console.log("Convex data:", data);
    if (data && data.chunks && data.chunks.length > 0) {
      updateEmbeddings(data.chunks as EmbeddingChunk[]);
      setCursor(data.nextCursor);
    }
  }, [data, updateEmbeddings]);

  // Log the current embeddings in the store for debugging
  useEffect(() => {
    console.log("Embeddings in store:", embeddings.length);
    if (embeddings.length > 0) {
      console.log("First embedding sample:", embeddings[0]);
    }
  }, [embeddings]);

  // Instantiate the WebWorker with improved error handling
  useEffect(() => {
    try {
      workerRef.current = new Worker("/graph.worker.js");
      const worker = workerRef.current;
      
      console.log("Web worker initialized");
      
      worker.onmessage = (event: MessageEvent) => {
        console.log("Received worker message:", event.data);
        const { type, data } = event.data;
        
        if (type === "SIMILARITIES_CALCULATED") {
          console.log(`Received ${data?.length || 0} links from worker`);
          if (Array.isArray(data)) {
            updateGraphLinks(data as GraphLink[]);
          } else {
            console.error("SIMILARITIES_CALCULATED returned invalid data", data);
            updateGraphLinks([]);
          }
        } else if (type === "NODES_BUILT") {
          console.log(`Received ${data?.nodes?.length || 0} nodes from worker`);
          if (data && Array.isArray(data.nodes)) {
            // For 3D visualization, add z coordinate to nodes if not present
            const nodesWithZ = data.nodes.map(node => ({
              ...node,
              // Add random initial z position if not provided
              z: node.z || (Math.random() - 0.5) * 100
            }));
            updateGraphNodes(nodesWithZ);
          } else {
            console.error("NODES_BUILT returned invalid data", data);
            updateGraphNodes([]);
          }
        } else if (type === "ERROR") {
          console.error("Worker error:", data?.message, data?.stack);
        }
      };
      
      worker.onerror = (error) => {
        console.error("Worker error event:", error);
      };
    } catch (error) {
      console.error("Error initializing worker:", error);
    }
  
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [updateGraphLinks, updateGraphNodes]);

  // Trigger worker processing when embeddings change
  useEffect(() => {
    if (workerRef.current && embeddings.length > 0) {
      console.log("Sending data to worker, embeddings length:", embeddings.length);
      
      try {
        // Process nodes first
        workerRef.current.postMessage({
          type: "BUILD_GRAPH",
          data: { embeddings },
        });
        
        // Process links with a small delay to avoid overloading the worker
        setTimeout(() => {
          workerRef.current?.postMessage({
            type: "CALCULATE_SIMILARITIES",
            data: { embeddings, topK },
          });
        }, 100);
      } catch (error) {
        console.error("Error sending data to worker:", error);
      }
    }
  }, [embeddings]);

  // Function to generate a test graph for debugging
  const renderTestGraph = () => {
    console.log("Generating test graph");
    const testNodes = embeddings.slice(0, 20).map((chunk, index) => ({
      id: chunk.id,
      label: chunk.metadata?.keywords?.[0] || `Node ${index}`,
      group: chunk.metadata?.topics?.[0] || 'default',
      version: chunk.version || 1,
      // Add Z coordinate for 3D
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100
    }));
    
    const testLinks = [];
    for (let i = 0; i < testNodes.length; i++) {
      const source = testNodes[i].id;
      for (let j = 0; j < 2; j++) {
        const targetIndex = (i + j + 1) % testNodes.length;
        testLinks.push({
          source: source,
          target: testNodes[targetIndex].id,
          similarity: 0.5 + Math.random() * 0.5,
          relationship: "test connection"
        });
      }
    }
    
    setGraphData({
      nodes: testNodes,
      links: testLinks
    });
  };

  // Reset view function for 3D
  const resetView = () => {
    if (!instanceRef.current || !instanceRef.current.cameraPosition) return;
    
    try {
      instanceRef.current.cameraPosition(
        { position: { x: 0, y: 0, z: 200 } },
        { x: 0, y: 0, z: 0 },
        1000
      );
    } catch (error) {
      console.error("Error resetting view:", error);
    }
  };

  // Render loading state if no embeddings are available
  if ((!data || !data.chunks) && embeddings.length === 0) {
    return <div>Loading...</div>;
  }
  if (!data?.chunks && embeddings.length === 0) {
    return <div>No embeddings available.</div>;
  }

  return (
    <div className="w-full h-full relative">
      {/* Make sure the ForceGraph3D component is rendered properly */}
      {typeof ForceGraph3D === 'function' ? (
        <ForceGraph3D
          ref={instanceRef}
          graphData={graphData}
          nodeLabel="label"
          linkLabel={(link) => {
            const source = graphData.nodes.find(node => node.id === link.source)?.label || 'Unknown';
            const target = graphData.nodes.find(node => node.id === link.target)?.label || 'Unknown';
            const strength = (link.similarity * 100).toFixed(1);
            return `${source} → ${target}\nStrength: ${strength}%`;
          }}
          nodeAutoColorBy="group"
          nodeColor={(node) => nodeColors[node.group] || nodeColors.default}
          nodeRelSize={6} // Node size in 3D
          linkWidth={(link) => link.similarity * 2}
          linkOpacity={0.6}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={(link) => link.similarity * 2}
          linkDirectionalParticleSpeed={0.003}
          backgroundColor="#f9fafb"
          showNavInfo={false} // Hide default navigation info
          width={width}
          height={height}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          Error loading 3D graph component. Check your console for details.
        </div>
      )}
      
      {/* Debug Button */}
      <button 
        className="absolute top-4 left-4 z-10 px-2 py-1 bg-gray-200 rounded text-xs"
        onClick={() => setShowDebugInfo(!showDebugInfo)}
      >
        Debug
      </button>
      
      {/* Simple Controls */}
      <div className="absolute top-4 left-24 z-10 flex space-x-2">
        <button 
          className="px-2 py-1 bg-gray-200 rounded text-xs"
          onClick={resetView}
        >
          Reset View
        </button>
      </div>
      
      {/* Load More Button (if pagination is available) */}
      {cursor && (
        <button
          className="absolute top-4 right-4 z-10 px-2 py-1 bg-blue-500 text-white rounded text-xs"
          onClick={() => setLimit(prev => prev + 100)}
        >
          Load More
        </button>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/80 p-2 rounded shadow-md text-xs">
        <div className="font-semibold mb-1">3D Navigation:</div>
        <div>• Left-click + drag: Rotate</div>
        <div>• Right-click + drag: Pan</div>
        <div>• Scroll: Zoom</div>
        <div>• Click node: Focus and track</div>
      </div>
      
      {/* Debug Panel */}
      {showDebugInfo && (
        <div className="absolute top-16 right-4 z-10 bg-white/80 p-2 rounded shadow-md text-xs">
          <div>Embeddings: {embeddings.length}</div>
          <div>Nodes: {graphData.nodes.length}</div>
          <div>Links: {graphData.links.length}</div>
          <div className="mt-2 flex space-x-2">
            <button 
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
              onClick={() => renderTestGraph()}
            >
              Test Graph
            </button>
            <button 
              className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
              onClick={() => setShowDebugInfo(false)}
            >
              Hide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddingGraph;