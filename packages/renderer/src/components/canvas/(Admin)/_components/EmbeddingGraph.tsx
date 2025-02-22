// Graph-UI
// /Users/matthewsimon/Documents/Github/solomon-desktop/solomon-Desktop/next/src/components/canvas/(Admin)/_components/EmbeddingGraph.tsx

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { cosineSimilarity } from "@/lib/similarity";
import { GraphData, GraphLink, GraphNode } from "@/types/graph";
import pLimit from "p-limit";
import { refineNodeLabel, refineEdgeRelationship } from "./nodeRefiner";
import { useWindowSize } from '@react-hook/window-size';

interface CameraState {
  x: number;
  y: number;
  z: number;
}

interface ForceGraph2DInstance {
  refresh?: () => void;
  zoomToFit?: (ms?: number, padding?: number, nodeFilterFn?: (node: any) => boolean) => void;
    d3Force?: (forceName: string, forceFn?: any) => any; // If you use d3Force
  camera: {
    (state: CameraState, transitionDuration?: number): void;
    (): CameraState;
  };
  _renderer?: { domElement?: HTMLCanvasElement };
}

interface ForceGraph2DProps { // Add width and height
    graphData: GraphData;
    nodeLabel: string;
    linkLabel: string;
    nodeAutoColorBy: string;
    linkWidth: (link: GraphLink) => number;
    linkDirectionalParticles: number;
    linkDirectionalParticleWidth: (link: GraphLink) => number;
    backgroundColor: string;
    onEngineStop: () => void;
    nodeCanvasObject: (
        node: GraphNode,
        ctx: CanvasRenderingContext2D,
        globalScale: number
    ) => void;
    width: number; // Add width
    height: number; // Add height
}

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d") as any, { ssr: false }
);

interface EmbeddingChunk {
  id: string;
  pageContent: string;
  embedding: number[];
  metadata?: {
    keywords?: string[];
    topics?: string[];
    module?: string | null;
  };
}

const EmbeddingGraph: React.FC = () => { //No longer accepting size.
  // State
  const INITIAL_LIMIT = 100;
  const [limit, setLimit] = useState<number>(INITIAL_LIMIT);
  const [cursor, setCursor] = useState<string | null>(null);
  const [allEmbeddings, setAllEmbeddings] = useState<EmbeddingChunk[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [linkStrength, setLinkStrength] = useState<number>(1);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [isEngineRunning, setIsEngineRunning] = useState(true); // New state
  const topK = 5;

  // Refs
    const instanceRef = useRef<ForceGraph2DInstance | null>(null); //Ref for instance

  // Convex mutations
  const batchUpsertGraphNodes = useMutation(api.graph.batchUpsertGraphNodes);
  const batchUpsertGraphLinks = useMutation(api.graph.batchUpsertGraphLinks);

    const [width, height] = useWindowSize(); // Get window size

  // Convex query
  const data = useQuery(api.chunks.getAllEmbeddings, { limit, cursor });
  const isLoading = data === undefined;

  // Load from sessionStorage on mount
  useEffect(() => {
    const savedEmbeddings = sessionStorage.getItem("allEmbeddings");
    const savedGraphData = sessionStorage.getItem("graphData");

    if (savedEmbeddings && savedGraphData) {
      setAllEmbeddings(JSON.parse(savedEmbeddings));
      setGraphData(JSON.parse(savedGraphData));
    }
  }, []);

  // Debug-log fetched data
  useEffect(() => {
    console.log("Fetched Data:", data);
  }, [data]);

  // Update embeddings on data change
  useEffect(() => {
    if (allEmbeddings.length === 0 && data?.chunks && data.chunks.length > 0) {
      console.log("Fetched Chunks:", data.chunks);
      setAllEmbeddings((prev) => [...prev, ...data.chunks]);
      setCursor(data.nextCursor);
      setCursorHistory((prev) => [...prev, data.nextCursor]);
        setIsEngineRunning(true);
    }
  }, [data, allEmbeddings.length]);

  // Build or rebuild the graph whenever allEmbeddings changes
    useEffect(() => {
        if (allEmbeddings.length === 0) return;

        async function buildGraph() {
          const limitLLM = pLimit(5);

          // Build nodes with refined labels
          const nodePromises = allEmbeddings.map((chunk) =>
            limitLLM(async () => {
              const kw = chunk.metadata?.keywords || [];
              const tp = chunk.metadata?.topics || [];
              const fallbackLabel = chunk.id.slice(0, 8);
              const { label, group } = await refineNodeLabel(kw, tp, fallbackLabel);
              return { id: chunk.id, label, group } as GraphNode;
            })
          );
          const nodes: GraphNode[] = await Promise.all(nodePromises);

          // Build links based on cosine similarity
          const linkPromises: Promise<GraphLink>[] = [];
          allEmbeddings.forEach((chunkA, indexA) => {
            const similarities = allEmbeddings.map((chunkB, indexB) => {
              if (indexA === indexB) return { id: chunkB.id, similarity: -1 }; // Avoid self-links
              const sim = cosineSimilarity(chunkA.embedding, chunkB.embedding); // Calculate similarity
              return { id: chunkB.id, similarity: sim };
            });
            // Get top similar chunks
            const topSimilar = similarities
              .filter((sim) => sim.similarity > 0)
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, topK);

            // Create links for top similar chunks
            topSimilar.forEach((sim) => {
              const chunkB = allEmbeddings.find((c) => c.id === sim.id);
              if (!chunkB) return; // Ensure chunkB exists

              const linkP = limitLLM(async () => {
                const snippetA = chunkA.pageContent.slice(0, 300);
                const snippetB = chunkB.pageContent.slice(0, 300);
                const relationship = await refineEdgeRelationship(snippetA, snippetB); // Refine edge
                return {
                  source: chunkA.id,
                  target: chunkB.id,
                  similarity: sim.similarity,
                  relationship,
                } as GraphLink;
              });
              linkPromises.push(linkP);
            });
          });
          const links = await Promise.all(linkPromises);

          console.log("Generated Links with Relationships:", links);
          setGraphData({ nodes, links }); // Update graph data

          // Batch update database
          try {
            const nodesForBatch = nodes.map((node) => ({
              documentChunkId: node.id,
              label: node.label,
              group: node.group,
              significance: node.significance ?? 0, // Handle optional significance
            }));
            const linksForBatch = links.map((link) => ({
              source: link.source,
              target: link.target,
              similarity: link.similarity,
              relationship: link.relationship,
            }));
            await batchUpsertGraphNodes({ nodes: nodesForBatch });
            await batchUpsertGraphLinks({ links: linksForBatch });
          } catch (error) {
            console.error("Error with batched graph updates:", error);
          }
        }

        buildGraph();
    }, [allEmbeddings, batchUpsertGraphNodes, batchUpsertGraphLinks]);

    // Persist data to sessionStorage
    useEffect(() => {
        if (allEmbeddings.length > 0) {
            sessionStorage.setItem("allEmbeddings", JSON.stringify(allEmbeddings));
            sessionStorage.setItem("graphData", JSON.stringify(graphData));
        }
    }, [allEmbeddings, graphData]);

  // Handle engine stop
    const handleEngineStop = () => {
        console.warn("Engine stopped");
        setIsEngineRunning(false); // Engine is stopped
        if (instanceRef.current && instanceRef.current.zoomToFit) {
            instanceRef.current.zoomToFit(0, 20); // 0ms transition, 20px padding
          }
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
          handleEngineStop();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload);
        }
    }, []);


  const loadMore = () => {
    const latestCursor = cursorHistory[cursorHistory.length - 1];
    if (latestCursor) {
      setLimit((prev) => prev + 100);
    }
  };

  const loadLess = () => {
    if (cursorHistory.length > 1) {
      setCursorHistory((prev) => prev.slice(0, prev.length - 1));
      setAllEmbeddings((prev) => prev.slice(0, prev.length - 100));
      setLimit((prev) => Math.max(prev - 100, INITIAL_LIMIT));
      setCursor(cursorHistory[cursorHistory.length - 2]);
    }
  };

  const handleRefresh = () => {
    sessionStorage.removeItem("allEmbeddings");
    sessionStorage.removeItem("graphData");
    sessionStorage.removeItem("camera");
    setAllEmbeddings([]);
    setGraphData({ nodes: [], links: [] });
    setCursor(null);
    setLimit(INITIAL_LIMIT);
    setCursorHistory([null]);
    setIsEngineRunning(true); // Reset engine running state
  };

  const isNoData = (isLoading || !data) && allEmbeddings.length === 0;
  const isNoEmbeddings =
    !isLoading && data && data.chunks.length === 0 && allEmbeddings.length === 0;

    // Call zoomToFit AFTER data update and engine stop
    useEffect(() => {
    // Ensure graphData and instanceRef are valid
        if (!isEngineRunning && graphData.nodes.length > 0 && instanceRef.current) {
                if (instanceRef.current.zoomToFit) {
                    console.log("Calling zoomToFit after data update and engine stop");
                    instanceRef.current.zoomToFit(0, 20); // 0ms transition, 20px padding
                }
        }
    }, [graphData, isEngineRunning]); // Dependency on graphData and isEngine running


  if (isNoData) {
    return <div>Loading...</div>;
  }
  if (isNoEmbeddings) {
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
        linkWidth={(link) => link.similarity * linkStrength}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={(link) => link.similarity * linkStrength}
        backgroundColor="#f9fafb"
        onEngineStop={handleEngineStop}
        nodeCanvasObject={(node: GraphNode, ctx, globalScale) => {
          const nodeWithColor = node as GraphNode & { color?: string };
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = nodeWithColor.color || "#000";
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        width={width}
        height={height}
      />
    </div>
  );
};

export default EmbeddingGraph;