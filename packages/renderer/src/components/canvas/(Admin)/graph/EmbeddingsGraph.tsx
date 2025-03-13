// EmbeddingsGraph.tsx
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Admin)/graph/EmbeddingsGraph.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useGraphStore } from '@/lib/store/graphStore';
import { GraphCanvas, GraphNode, GraphLink, SimulationSettings } from './_components/GraphCanvas';
import { GraphControls } from './_components/GraphControls';
import { GraphUtilityButtons } from './_components/GraphUtilityButtons';
import { NodeDetailsPanel } from './_components/NodeDetailsPanel';

const EmbeddingsGraph: React.FC = () => {
  // 1) Retrieve data and functions from the store & Convex
  const {
    embeddings,
    graphData,
    updateGraphNodes,
    updateGraphLinks,
    setGraphData,
    resetGraph
  } = useGraphStore();

  const batchUpsertGraphNodes = useMutation(api.graph.batchUpsertGraphNodes);
  const batchUpsertGraphLinks = useMutation(api.graph.batchUpsertGraphLinks);
  const convexGraphData = useQuery(api.graph.getGraphData);

  // 2) Local UI state
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    linkDistance: 100,
    forceManyBody: -300,
    collisionRadius: 30,
    similarityThreshold: 0.5,
    showLabels: true,
    nodeGroupFilter: 'all',
  });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPanel, setShowPanel] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // 3) Compute unique groups for filtering
  const uniqueGroups = useMemo(() => {
    const groups = new Set<string>();
    if (graphData && graphData.nodes) {
      graphData.nodes.forEach((node) => groups.add(node.group));
    }
    return ['all', ...Array.from(groups)];
  }, [graphData]);

  // 4) Filter nodes based on search term and selected group
  const filteredNodes = useMemo(() => {
    if (!graphData || !graphData.nodes) return [];
    return graphData.nodes.filter((node) => {
      const matchesSearch =
        searchTerm === '' ||
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.documentChunkId &&
          node.documentChunkId.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesGroup =
        simulationSettings.nodeGroupFilter === 'all' ||
        node.group === simulationSettings.nodeGroupFilter;
      return matchesSearch && matchesGroup;
    });
  }, [graphData, searchTerm, simulationSettings.nodeGroupFilter]);

  // 5) Filter links based on filtered nodes and similarity threshold
  const filteredLinks = useMemo(() => {
    if (!graphData || !graphData.links) return [];
    const nodeIds = new Set(filteredNodes.map((node) => node.id));
    let links = graphData.links.filter((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    return links.filter((link) => link.similarity >= simulationSettings.similarityThreshold);
  }, [graphData, filteredNodes, simulationSettings.similarityThreshold]);

  // 6) Fallback: if graphData is empty, use data from Convex
  useEffect(() => {
    if (
      (!graphData || (!graphData.nodes?.length && !graphData.links?.length)) &&
      convexGraphData
    ) {
      const nodes = convexGraphData.nodes?.map((node) => ({
        id: node.documentChunkId,
        documentChunkId: node.documentChunkId,
        label: node.label,
        group: node.group,
        significance: node.significance || 1,
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 600,
      })) || [];
      
      const links = convexGraphData.links?.map((link) => ({
        source: link.source,
        target: link.target, 
        similarity: link.similarity,
        relationship: link.relationship,
      })) || [];
      
      setGraphData({ nodes, links });
    }
  }, [convexGraphData, graphData, setGraphData]);

  // Handle refresh graph
  const handleRefreshGraph = () => {
    // Reset the graph state in our store
    resetGraph();
    
    // Reset any UI state
    setSelectedNode(null);
    setHoveredNode(null);
    setSearchTerm('');
    setSimulationSettings({
      linkDistance: 100,
      forceManyBody: -300,
      collisionRadius: 30,
      similarityThreshold: 0.5,
      showLabels: true,
      nodeGroupFilter: 'all',
    });
    
    // Force a complete remount of the GraphCanvas component
    setRefreshCount(prevCount => prevCount + 1);
  };

  // 7) Render main layout: graph area and controls side panel
  return (
    <div className="flex h-full">
      {/* Graph visualization area */}
      <Card className="flex-1 p-4 h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Embeddings Visualization</CardTitle>
            <GraphUtilityButtons
              showPanel={showPanel}
              onTogglePanel={() => setShowPanel(!showPanel)}
              onRefreshGraph={handleRefreshGraph}
            />
          </div>
          <CardDescription>
            {filteredNodes.length} nodes and {filteredLinks.length} connections
            {isProcessing && ' (Processing...)'}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 relative min-h-0">
          <div className="absolute inset-0 overflow-hidden">
            <GraphCanvas
              key={`graph-canvas-${refreshCount}`} // Force complete remount on refresh
              width={800}
              height={600}
              nodes={filteredNodes}
              links={filteredLinks}
              simulationSettings={simulationSettings}
              onNodeHover={setHoveredNode}
              onNodeSelect={setSelectedNode}
              hoveredNode={hoveredNode}
              selectedNode={selectedNode}
            />
          </div>
          {isProcessing && filteredNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 rounded-full border-t-2 border-b-2 border-gray-900 animate-spin"></div>
                <div className="text-sm font-medium">Processing embeddings...</div>
              </div>
            </div>
          )}
          {!isProcessing && filteredNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6">
                <h3 className="text-lg font-medium mb-2">No Graph Data Available</h3>
                <p className="text-muted-foreground mb-4">
                  There are no nodes to display. Either no embeddings are loaded or they don't match your filters.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side panel with controls and details */}
      {showPanel && (
        <Card className="w-72 ml-2 p-2 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto">
            <Tabs defaultValue="controls">
              <TabsList className="w-full">
                <TabsTrigger value="controls" className="flex-1">
                  Controls
                </TabsTrigger>
                <TabsTrigger value="details" className="flex-1">
                  Details
                </TabsTrigger>
              </TabsList>
              <TabsContent value="controls" className="space-y-4 pt-4">
                <GraphControls
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  simulationSettings={simulationSettings}
                  onSimulationSettingsChange={setSimulationSettings}
                  uniqueGroups={uniqueGroups}
                />
              </TabsContent>
              <TabsContent value="details" className="pt-4">
                <NodeDetailsPanel
                  selectedNode={selectedNode}
                  filteredLinks={filteredLinks}
                  filteredNodes={filteredNodes}
                  onSelectNode={setSelectedNode}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmbeddingsGraph;