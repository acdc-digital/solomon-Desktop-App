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

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d"),
  { ssr: false }
);

interface CameraState {
  x: number;
  y: number;
  z: number;
}

interface ForceGraph2DInstance {
  refresh?: () => void;
  zoomToFit?: (ms?: number, padding?: number, nodeFilterFn?: (node: any) => boolean) => void;
  camera: {
    (state: CameraState, transitionDuration?: number): void;
    (): CameraState;
  };
  _renderer?: { domElement?: HTMLCanvasElement };
}

const topK = 5;
const INITIAL_LIMIT = 100;

const EmbeddingGraph: React.FC = () => {
  // Get store methods and state (make sure your store exports updateGraphNodes)
  const {
    embeddings,
    updateEmbeddings,
    graphData,
    setGraphData,
    updateGraphLinks,
    updateGraphNodes,
  } = useGraphStore();
  
  const [width, height] = useWindowSize();
  const instanceRef = useRef<ForceGraph2DInstance | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Pagination state
  const [limit, setLimit] = useState<number>(INITIAL_LIMIT);
  const [cursor, setCursor] = useState<string | null>(null);

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
    console.log("Embeddings in store:", embeddings);
  }, [embeddings]);

  // Instantiate the WebWorker
  useEffect(() => {
    workerRef.current = new Worker("/graph.worker.js");
    const worker = workerRef.current;
  
    worker.onmessage = (event: MessageEvent) => {
      console.log("Received worker message:", event.data);
      const { type, data } = event.data;
      if (type === "SIMILARITIES_CALCULATED") {
        if (Array.isArray(data)) {
          updateGraphLinks(data as GraphLink[]);
        } else {
          console.error("SIMILARITIES_CALCULATED returned invalid data", data);
          updateGraphLinks([]);
        }
      } else if (type === "NODES_BUILT") {
        if (data && Array.isArray(data.nodes)) {
          // Use dedicated updater for nodes
          updateGraphNodes(data.nodes);
        } else {
          console.error("NODES_BUILT returned invalid data", data);
          updateGraphNodes([]);
        }
      }
    };
  
    return () => {
      worker.terminate();
    };
  }, [updateGraphLinks, updateGraphNodes]);

  // Trigger worker processing when embeddings change
  useEffect(() => {
    if (workerRef.current && embeddings.length > 0) {
      workerRef.current.postMessage({
        type: "CALCULATE_SIMILARITIES",
        data: { embeddings, topK },
      });
      workerRef.current.postMessage({
        type: "BUILD_GRAPH",
        data: { embeddings },
      });
    }
  }, [embeddings]);

  // Optional: Temporarily inject dummy graph data to test rendering
  // Uncomment to test static graph rendering:
  /*
  useEffect(() => {
    const dummyGraph: GraphData = {
      nodes: [
        { id: "node1", label: "Node 1", group: "A", version: 1 },
        { id: "node2", label: "Node 2", group: "B", version: 1 },
      ],
      links: [
        { source: "node1", target: "node2", similarity: 1, relationship: "related" }
      ],
    };
    console.log("Setting dummy graph data", dummyGraph);
    setGraphData(dummyGraph);
  }, [setGraphData]);
  */

  const handleEngineStop = () => {
    if (instanceRef.current?.zoomToFit) {
      instanceRef.current.zoomToFit(0, 20);
    }
  };

  // Log current graph data
  useEffect(() => {
    console.log("Graph Data:", graphData);
  }, [graphData]);

  // Render loading state if no embeddings are available
  if ((!data || !data.chunks) && embeddings.length === 0) {
    return <div>Loading...</div>;
  }
  if (!data?.chunks && embeddings.length === 0) {
    return <div>No embeddings available.</div>;
  }

  return (
    <div className="w-full h-full">
      <ForceGraph2D
        ref={instanceRef}
        graphData={graphData}
        nodeLabel="label"
        linkLabel="relationship"
        nodeAutoColorBy="group"
        linkWidth={(link: GraphLink) => link.similarity}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={(link: GraphLink) => link.similarity}
        backgroundColor="#f9fafb"
        onEngineStop={handleEngineStop}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = node.color || "#000";
          ctx.beginPath();
          ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        width={width}
        height={height}
      />
    </div>
  );
};

export default EmbeddingGraph;