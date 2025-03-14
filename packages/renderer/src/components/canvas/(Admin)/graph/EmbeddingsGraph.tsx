import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import debounce from 'lodash/debounce';

import { useGraphStore } from '@/lib/store/graphStore';
import { GraphCanvas, GraphNode, GraphLink } from './_components/GraphCanvas';
import { GraphControls } from './_components/GraphControls';
import { GraphUtilityButtons } from './_components/GraphUtilityButtons';
import { NodeDetailsPanel } from './_components/NodeDetailsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EmbeddingsGraph: React.FC = () => {
  const {
    graphData,
    updateGraphNodes,
    updateGraphLinks,
    setGraphData,
    simulationSettings,
    updateSimulationSettings,
    resetGraph,
    resetAll,
    isProcessing,
    setProcessing,
    selectionState,
    setSelectedNode,
    setHoveredNode,
    undo,
    redo,
    pushStateToHistory
  } = useGraphStore();

  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [showPanel, setShowPanel] = useState(true);

  const batchUpsertGraphNodes = useMutation(api.graph.batchUpsertGraphNodes);
  const batchUpsertGraphLinks = useMutation(api.graph.batchUpsertGraphLinks);
  const convexGraphData = useQuery(api.graph.getGraphData);
  const generateLabels = useMutation(api.aiServices.batchGenerateLabels);

  const uniqueGroups = useMemo(() => {
    const groups = new Set<string>();
    if (graphData && graphData.nodes) {
      graphData.nodes.forEach((node) => groups.add(node.group));
    }
    return ['all', ...Array.from(groups)];
  }, [graphData]);

  const debouncedSetSearchTerm = useMemo(
    () =>
      debounce((term: string) => {
        setSearchTerm(term);
      }, 300),
    [setSearchTerm]
  );

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

  const filteredLinks = useMemo(() => {
    if (!graphData || !graphData.links || filteredNodes.length === 0) return [];
    const nodeIds = new Set(filteredNodes.map((node) => node.id));
    return graphData.links.filter((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return (
        nodeIds.has(sourceId) &&
        nodeIds.has(targetId) &&
        link.similarity >= simulationSettings.similarityThreshold
      );
    });
  }, [graphData, filteredNodes, simulationSettings.similarityThreshold]);

  // Fallback: load fresh data from Convex only if convexGraphData exists and has nodes.
  useEffect(() => {
    if (
      convexGraphData &&
      convexGraphData.nodes &&
      convexGraphData.nodes.length > 0 &&
      (!graphData || !graphData.nodes || graphData.nodes.length === 0)
    ) {
      const nodes =
        convexGraphData.nodes.map((node) => ({
          id: node.documentChunkId,
          documentChunkId: node.documentChunkId,
          label: node.label,
          group: node.group,
          significance: node.significance || 1,
          x: (Math.random() - 0.5) * 800,
          y: (Math.random() - 0.5) * 600,
        })) || [];
      const links =
        convexGraphData.links?.map((link) => ({
          source: link.source,
          target: link.target,
          similarity: link.similarity,
          relationship: link.relationship,
        })) || [];
      setGraphData({ nodes, links });
      toast({
        title: "Graph data loaded",
        description: `Loaded ${nodes.length} nodes and ${links.length} links`,
      });
    }
  }, [convexGraphData, graphData, setGraphData, toast]);

  // Reset handler to clear local state (and optionally localStorage) so fresh data is loaded.
  const handleResetGraphState = useCallback(() => {
    resetAll();
    localStorage.removeItem('solomon-graph-storage');
    toast({
      title: "Graph reset",
      description: "Graph state has been reset and will load fresh data.",
    });
  }, [resetAll, toast]);

  const handleGenerateTestData = useCallback(async () => {
    setProcessing(true);
    try {
      const testNodes = Array.from({ length: 30 }, (_, i) => ({
        documentChunkId: `test-${i}`,
        label: `Test Node ${i}`,
        group: ['Research', 'Design', 'Development', 'Marketing'][Math.floor(Math.random() * 4)],
        significance: Math.random() * 2 + 0.5,
      }));
      const testLinks = [];
      for (let i = 0; i < testNodes.length; i++) {
        const numConnections = Math.floor(Math.random() * 4) + 2;
        for (let j = 0; j < numConnections; j++) {
          let targetIndex;
          do {
            targetIndex = Math.floor(Math.random() * testNodes.length);
          } while (targetIndex === i);
          const similarity = Math.random() * 0.6 + 0.4;
          let relationship;
          if (similarity > 0.8) relationship = "strong";
          else if (similarity > 0.6) relationship = "similar";
          else relationship = "related";
          testLinks.push({
            source: testNodes[i].documentChunkId,
            target: testNodes[targetIndex].documentChunkId,
            similarity,
            relationship,
          });
        }
      }
      await batchUpsertGraphNodes({ nodes: testNodes });
      await batchUpsertGraphLinks({ links: testLinks });
      setGraphData({
        nodes: testNodes.map(node => ({
          ...node,
          id: node.documentChunkId,
          x: (Math.random() - 0.5) * 800,
          y: (Math.random() - 0.5) * 600,
        })),
        links: testLinks
      });
      toast({
        title: "Test data generated",
        description: `Created ${testNodes.length} nodes and ${testLinks.length} connections`,
      });
    } catch (error) {
      console.error("Error generating test data:", error);
      toast({
        title: "Error",
        description: "Failed to generate test data",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }, [batchUpsertGraphNodes, batchUpsertGraphLinks, setGraphData, setProcessing, toast]);

  const handleGenerateLinks = useCallback(async () => {
    if (!graphData || !graphData.nodes || graphData.nodes.length < 2) {
      toast({
        title: "Cannot generate links",
        description: "Need at least 2 nodes to generate links",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      const nodes = graphData.nodes;
      const newLinks = [];
      for (let i = 0; i < nodes.length; i++) {
        const sourceNode = nodes[i];
        const sameGroupNodes = nodes.filter((n, idx) => idx !== i && n.group === sourceNode.group);
        sameGroupNodes.forEach((targetNode) => {
          newLinks.push({
            source: sourceNode.id,
            target: targetNode.id,
            similarity: 0.7 + Math.random() * 0.3,
            relationship: "strong",
          });
        });
        const otherGroupNodes = nodes.filter((n, idx) => idx !== i && n.group !== sourceNode.group);
        const randomCount = Math.min(3, otherGroupNodes.length);
        const selectedIndices = new Set<number>();
        while (selectedIndices.size < randomCount) {
          selectedIndices.add(Math.floor(Math.random() * otherGroupNodes.length));
        }
        Array.from(selectedIndices).forEach((idx) => {
          newLinks.push({
            source: sourceNode.id,
            target: otherGroupNodes[idx].id,
            similarity: 0.4 + Math.random() * 0.3,
            relationship: "related",
          });
        });
      }
      await batchUpsertGraphLinks({ links: newLinks });
      const existingLinkKeys = new Set();
      graphData.links.forEach((link) => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        existingLinkKeys.add(`${sourceId}-${targetId}`);
      });
      const uniqueNewLinks = newLinks.filter((link) => {
        const key = `${link.source}-${link.target}`;
        return !existingLinkKeys.has(key);
      });
      updateGraphLinks([...graphData.links, ...uniqueNewLinks]);
      pushStateToHistory();
      toast({
        title: "Links generated",
        description: `Created ${uniqueNewLinks.length} new connections`,
      });
    } catch (error) {
      console.error("Error generating links:", error);
      toast({
        title: "Error",
        description: "Failed to generate links",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }, [batchUpsertGraphLinks, graphData, pushStateToHistory, setProcessing, toast, updateGraphLinks]);

  const handleOptimizeLabels = useCallback(async () => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      toast({
        title: "No nodes to optimize",
        description: "Add some nodes first",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      const nodeContents = graphData.nodes.map((node) =>
        node.label.length > 20 ? node.label : `Sample content for ${node.label}`
      );
      const optimizedLabels = await generateLabels({
        texts: nodeContents,
        maxWords: 5,
      });
      const updatedNodes = graphData.nodes.map((node, idx) => ({
        ...node,
        label: optimizedLabels[idx] || node.label,
      }));
      updateGraphNodes(updatedNodes);
      pushStateToHistory();
      toast({
        title: "Labels optimized",
        description: `Updated labels for ${updatedNodes.length} nodes`,
      });
    } catch (error) {
      console.error("Error optimizing labels:", error);
      toast({
        title: "Error",
        description: "Failed to optimize labels",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }, [generateLabels, graphData, pushStateToHistory, setProcessing, toast, updateGraphNodes]);

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, [setHoveredNode]);

  return (
    <div className="flex h-full">
      <Card className="flex-1 p-4 h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Embeddings Visualization</CardTitle>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={undo} disabled={!graphData}>
                Undo
              </Button>
              <Button size="sm" variant="outline" onClick={redo} disabled={!graphData}>
                Redo
              </Button>
              <GraphUtilityButtons
                onGenerateTestData={handleGenerateTestData}
                onGenerateLinks={handleGenerateLinks}
                onOptimizeLabels={handleOptimizeLabels}
                onDebugConnections={() => console.log("Debug connections triggered")}
                showPanel={showPanel}
                onTogglePanel={() => setShowPanel(!showPanel)}
                onResetGraph={resetGraph}
                isProcessing={isProcessing}
              />
              <Button size="sm" variant="outline" onClick={handleResetGraphState}>
                Reset Graph
              </Button>
            </div>
          </div>
          <CardDescription>
            {filteredNodes.length} nodes and {filteredLinks.length} connections {isProcessing && ' (Processing...)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 relative min-h-0">
          <div className="absolute inset-0 overflow-hidden">
            <GraphCanvas
              width={800}
              height={600}
              nodes={filteredNodes}
              links={filteredLinks}
              simulationSettings={simulationSettings}
              onNodeHover={handleNodeHover}
              onNodeSelect={handleNodeSelect}
              hoveredNode={selectionState.hoveredNode}
              selectedNode={selectionState.selectedNode}
            />
          </div>
          {isProcessing && filteredNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
                <div className="text-sm font-medium">Processing data...</div>
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
                <Button>Generate Test Data</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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
                  onSearchChange={(value) => debouncedSetSearchTerm(value)}
                  simulationSettings={simulationSettings}
                  onSimulationSettingsChange={updateSimulationSettings}
                  uniqueGroups={uniqueGroups}
                />
              </TabsContent>
              <TabsContent value="details" className="pt-4">
                <NodeDetailsPanel
                  selectedNode={selectionState.selectedNode}
                  filteredLinks={filteredLinks}
                  filteredNodes={filteredNodes}
                  onSelectNode={handleNodeSelect}
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