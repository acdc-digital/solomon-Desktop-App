// EmbeddingsGraph.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useGraphStore } from '@/lib/store/useGraphStore';

// Define types for graph data (if not already in the store)
interface GraphNode {
  id: string;
  documentChunkId?: string;
  label: string;
  group: string;
  significance?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string;
  target: string;
  similarity: number;
  relationship: string;
}

// Utility function for cosine similarity calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be of the same length.");
  }

  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * (vecB[idx] || 0), 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

const EmbeddingsGraph: React.FC = () => {
  // Use the graph store from Zustand
  const { 
    embeddings, 
    graphData, 
    updateGraphNodes, 
    updateGraphLinks,
    setGraphData
  } = useGraphStore();
  
  // Get graph data from Convex (fallback mechanism)
  const convexGraphData = useQuery(api.graph.getGraphData);
  
  // State for visualization settings
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [simulationSettings, setSimulationSettings] = useState({
    linkDistance: 100,
    charge: -300,
    collisionRadius: 30,
    similarityThreshold: 0.5,
    showLabels: true,
    nodeGroupFilter: 'all',
    forceManyBody: -300,
  });
  
  // UI state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPanel, setShowPanel] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // References
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  
  // Process embeddings into graph data
  const processEmbeddings = async () => {
    if (embeddings.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      console.log("Processing embeddings:", embeddings.length);
      
      // Create nodes from embeddings
      const nodes: GraphNode[] = embeddings.map(embedding => {
        // Extract sensible label and group from the embedding
        const label = embedding.metadata?.title || 
                     embedding.metadata?.keywords?.[0] || 
                     embedding.content?.substring(0, 30) || 
                     `Node ${embedding.id.substring(0, 8)}`;
        
        const group = embedding.metadata?.topics?.[0] || 
                      embedding.metadata?.category || 
                      'default';
                      
        return {
          id: embedding.id,
          documentChunkId: embedding.id,
          label: label,
          group: group,
          significance: embedding.metadata?.importance || 1,
          // Initial positions for better layout start
          x: (Math.random() - 0.5) * 800,
          y: (Math.random() - 0.5) * 600
        };
      });
      
      updateGraphNodes(nodes);
      
      // Calculate link similarities
      // We'll use a more efficient approach than computing all pairs
      // Only calculate for a limited number of potential connections per node
      const topK = 5; // Number of connections per node to compute
      const links: GraphLink[] = [];
      
      // For each embedding, find the top K most similar other embeddings
      for (let i = 0; i < embeddings.length; i++) {
        const sourceEmbedding = embeddings[i];
        
        // Skip if no embedding vector
        if (!sourceEmbedding.embedding || sourceEmbedding.embedding.length === 0) {
          continue;
        }
        
        // Calculate similarities with all other embeddings
        const similarities: {targetId: string; similarity: number;}[] = [];
        
        for (let j = 0; j < embeddings.length; j++) {
          if (i === j) continue; // Skip self
          
          const targetEmbedding = embeddings[j];
          
          // Skip if no embedding vector
          if (!targetEmbedding.embedding || targetEmbedding.embedding.length === 0) {
            continue;
          }
          
          try {
            const similarity = cosineSimilarity(
              sourceEmbedding.embedding, 
              targetEmbedding.embedding
            );
            
            if (similarity > simulationSettings.similarityThreshold) {
              similarities.push({
                targetId: targetEmbedding.id,
                similarity
              });
            }
          } catch (error) {
            console.error("Error calculating similarity:", error);
          }
        }
        
        // Sort similarities and take the top K
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topSimilarities = similarities.slice(0, topK);
        
        // Create links for top similarities
        for (const { targetId, similarity } of topSimilarities) {
          links.push({
            source: sourceEmbedding.id,
            target: targetId,
            similarity,
            relationship: 'similar'
          });
        }
      }
      
      updateGraphLinks(links);
      console.log(`Processed ${nodes.length} nodes and ${links.length} links`);
    } catch (error) {
      console.error("Error processing embeddings:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Effect to process embeddings when they change
  useEffect(() => {
    processEmbeddings();
  }, [embeddings]);
  
  // Effect to use Convex data as fallback
  useEffect(() => {
    if (!graphData || (!graphData.nodes?.length && !graphData.links?.length)) {
      if (convexGraphData && 
          (convexGraphData.nodes?.length || convexGraphData.links?.length)) {
        console.log("Using Convex graph data as fallback");
        
        // Transform Convex data to match our expected format
        const nodes = convexGraphData.nodes.map(node => ({
          id: node.documentChunkId,
          documentChunkId: node.documentChunkId,
          label: node.label,
          group: node.group,
          significance: node.significance || 1,
          x: (Math.random() - 0.5) * 800,
          y: (Math.random() - 0.5) * 600
        }));
        
        const links = convexGraphData.links.map(link => ({
          source: link.source,
          target: link.target,
          similarity: link.similarity,
          relationship: link.relationship
        }));
        
        setGraphData({ nodes, links });
      }
    }
  }, [convexGraphData, graphData, setGraphData]);
  
  // Get unique groups for filtering
  const uniqueGroups = React.useMemo(() => {
    const groups = new Set<string>();
    if (graphData && graphData.nodes) {
      graphData.nodes.forEach(node => groups.add(node.group));
    }
    return ['all', ...Array.from(groups)];
  }, [graphData]);
  
  // Filter nodes based on search and group filter
  const filteredNodes = React.useMemo(() => {
    if (!graphData || !graphData.nodes) return [];
    
    return graphData.nodes.filter(node => {
      const matchesSearch = searchTerm === '' || 
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.documentChunkId && node.documentChunkId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesGroup = simulationSettings.nodeGroupFilter === 'all' || 
        node.group === simulationSettings.nodeGroupFilter;
      
      return matchesSearch && matchesGroup;
    });
  }, [graphData, searchTerm, simulationSettings.nodeGroupFilter]);
  
  // Filter links based on filtered nodes and similarity threshold
  const filteredLinks = React.useMemo(() => {
    if (!graphData || !graphData.links) return [];
    
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    return graphData.links.filter(link => {
      return nodeIds.has(link.source as string) && 
             nodeIds.has(link.target as string) &&
             link.similarity >= simulationSettings.similarityThreshold;
    });
  }, [filteredNodes, graphData, simulationSettings.similarityThreshold]);
  
  // Prepare data for D3
  const preparedData = React.useMemo(() => {
    // Create a map for fast node lookup
    const nodeMap = new Map(filteredNodes.map(node => [node.id, node]));
    
    // Convert links to use actual node objects
    const processedLinks = filteredLinks.map(link => {
      // Handle both string IDs and object references
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      return {
        ...link,
        source: nodeMap.get(sourceId) || sourceId,
        target: nodeMap.get(targetId) || targetId
      };
    });
    
    return { nodes: filteredNodes, links: processedLinks };
  }, [filteredNodes, filteredLinks]);
  
  // Set up D3 visualization
  useEffect(() => {
    if (!svgRef.current || !preparedData.nodes.length) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Create SVG container with zoom capability
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");
    
    // Add zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoomBehavior);
    
    // Main group that will be transformed
    const g = svg.append("g");
    
    // Define color scale based on groups
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(uniqueGroups.filter(g => g !== 'all'));
    
    // Create links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(preparedData.links)
      .enter()
      .append("line")
      .attr("stroke-width", d => Math.max(1, d.similarity * 5))
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .append("title")
      .text(d => {
        const source = typeof d.source === 'object' ? d.source.label : d.source;
        const target = typeof d.target === 'object' ? d.target.label : d.target;
        return `${source} → ${target}: ${d.similarity.toFixed(2)} (${d.relationship})`;
      });
    
    // Create nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(preparedData.nodes)
      .enter()
      .append("circle")
      .attr("r", d => Math.max(5, (d.significance || 1) * 3 + 5))
      .attr("fill", d => colorScale(d.group) as string)
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("click", (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();
      })
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
        d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 2);
      })
      .on("mouseout", (event) => {
        setHoveredNode(null);
        d3.select(event.currentTarget).attr("stroke", null).attr("stroke-width", null);
      });
    
    node.append("title")
      .text(d => d.label);
    
    // Add labels if enabled
    if (simulationSettings.showLabels) {
      const labels = g.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(preparedData.nodes)
        .enter()
        .append("text")
        .text(d => d.label.length > 15 ? d.label.substring(0, 15) + "..." : d.label)
        .attr("font-size", 10)
        .attr("dx", 12)
        .attr("dy", 4)
        .style("pointer-events", "none");
    }
    
    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(preparedData.nodes)
      .force("link", d3.forceLink<GraphNode, any>(preparedData.links)
        .id(d => d.id)
        .distance(simulationSettings.linkDistance))
      .force("charge", d3.forceManyBody().strength(simulationSettings.forceManyBody))
      .force("collision", d3.forceCollide().radius(simulationSettings.collisionRadius))
      .force("center", d3.forceCenter(width / 2, height / 2));
    
    // Store simulation reference for updates
    simulationRef.current = simulation;
    
    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);
      
      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);
      
      if (simulationSettings.showLabels) {
        g.selectAll(".labels text")
          .attr("x", d => (d as any).x)
          .attr("y", d => (d as any).y);
      }
    });
    
    // Click on background to deselect node
    svg.on("click", () => {
      setSelectedNode(null);
    });
    
    // Dragging functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep the node fixed at its new position
      d.fx = event.x;
      d.fy = event.y;
    }
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [preparedData, width, height, simulationSettings, uniqueGroups]);
  
  // Update simulation when settings change
  useEffect(() => {
    if (!simulationRef.current) return;
    
    simulationRef.current
      .force("link", d3.forceLink().id((d: any) => d.id).distance(simulationSettings.linkDistance))
      .force("charge", d3.forceManyBody().strength(simulationSettings.forceManyBody))
      .force("collision", d3.forceCollide().radius(simulationSettings.collisionRadius))
      .alpha(0.3)
      .restart();
  }, [simulationSettings]);
  
  // Resize observer
  useEffect(() => {
    const container = svgRef.current?.parentElement;
    
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setWidth(width);
      setHeight(height);
    });
    
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Generate a test graph for debug purposes
  const generateTestGraph = () => {
    // Create test nodes
    const nodes: GraphNode[] = Array.from({ length: 30 }, (_, i) => ({
      id: `test-node-${i}`,
      label: `Test Node ${i}`,
      group: ['Group A', 'Group B', 'Group C'][Math.floor(Math.random() * 3)],
      significance: Math.random() * 2 + 0.5,
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600
    }));
    
    // Create test links with realistic patterns
    const links: GraphLink[] = [];
    
    // Each node connects to approximately 3 others
    nodes.forEach((source, i) => {
      // Connect to 2-4 random nodes, preferring nodes of the same group
      const numConnections = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < numConnections; j++) {
        // Choose a target, avoiding self-connection
        let targetIndex;
        do {
          targetIndex = Math.floor(Math.random() * nodes.length);
        } while (targetIndex === i);
        
        const target = nodes[targetIndex];
        
        // Higher similarity for same group
        const baseSimilarity = source.group === target.group ? 0.7 : 0.3;
        const similarity = Math.min(0.95, baseSimilarity + Math.random() * 0.3);
        
        links.push({
          source: source.id,
          target: target.id,
          similarity,
          relationship: source.group === target.group ? 'strong' : 'weak'
        });
      }
    });
    
    // Update the graph data
    setGraphData({ nodes, links });
  };
  
  return (
    <div className="flex h-full">
      {/* Main visualization */}
      <Card className="flex-1 p-4 h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Embeddings Visualization</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateTestGraph}
              >
                Test Data
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPanel(!showPanel)}
              >
                {showPanel ? 'Hide Controls' : 'Show Controls'}
              </Button>
            </div>
          </div>
          <CardDescription>
            {filteredNodes.length} nodes and {filteredLinks.length} connections
            {isProcessing && " (Processing...)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 relative min-h-0">
          <div className="absolute inset-0 overflow-hidden">
            <svg ref={svgRef} width="100%" height="100%" className="block" />
          </div>
          
          {/* Processing overlay */}
          {isProcessing && filteredNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 rounded-full border-t-2 border-b-2 border-gray-900 animate-spin"></div>
                <div className="text-sm font-medium">Processing embeddings...</div>
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {!isProcessing && filteredNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6">
                <h3 className="text-lg font-medium mb-2">No Graph Data Available</h3>
                <p className="text-muted-foreground mb-4">
                  There are no nodes to display. Either no embeddings are loaded, or they
                  don't match your current filters.
                </p>
                <Button onClick={generateTestGraph}>
                  Generate Test Data
                </Button>
              </div>
            </div>
          )}
          
          {/* Hover tooltip */}
          {hoveredNode && (
            <div 
              className="absolute p-2 bg-black/80 text-white rounded-md text-xs pointer-events-none z-10"
              style={{ 
                left: (hoveredNode.x || 0) + 20, 
                top: (hoveredNode.y || 0) - 30,
                maxWidth: '200px'
              }}
            >
              <div className="font-bold truncate">{hoveredNode.label}</div>
              <div>Group: {hoveredNode.group}</div>
              <div>Significance: {(hoveredNode.significance || 1).toFixed(2)}</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Side panel */}
      {showPanel && (
        <Card className="w-72 ml-4 p-4 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto">
            <Tabs defaultValue="controls">
              <TabsList className="w-full">
                <TabsTrigger value="controls" className="flex-1">Controls</TabsTrigger>
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="controls" className="space-y-4 pt-4">
                {/* Search */}
                <div className="space-y-1">
                  <Label htmlFor="search">Search</Label>
                  <Input 
                    id="search" 
                    placeholder="Search nodes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Group filter */}
                <div className="space-y-1">
                  <Label htmlFor="groupFilter">Filter by Group</Label>
                  <Select 
                    value={simulationSettings.nodeGroupFilter}
                    onValueChange={(value) => 
                      setSimulationSettings({...simulationSettings, nodeGroupFilter: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group === 'all' ? 'All Groups' : group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Similarity threshold */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Similarity Threshold: {simulationSettings.similarityThreshold.toFixed(2)}</Label>
                  </div>
                  <Slider 
                    value={[simulationSettings.similarityThreshold]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => 
                      setSimulationSettings({...simulationSettings, similarityThreshold: value[0]})
                    }
                  />
                </div>
                
                {/* Link distance */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Link Distance: {simulationSettings.linkDistance}</Label>
                  </div>
                  <Slider 
                    value={[simulationSettings.linkDistance]}
                    min={10}
                    max={300}
                    step={5}
                    onValueChange={(value) => 
                      setSimulationSettings({...simulationSettings, linkDistance: value[0]})
                    }
                  />
                </div>
                
                {/* Force strength */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Force Strength: {Math.abs(simulationSettings.forceManyBody)}</Label>
                  </div>
                  <Slider 
                    value={[Math.abs(simulationSettings.forceManyBody)]}
                    min={10}
                    max={1000}
                    step={10}
                    onValueChange={(value) => 
                      setSimulationSettings({...simulationSettings, forceManyBody: -value[0]})
                    }
                  />
                </div>
                
                {/* Collision radius */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Collision Radius: {simulationSettings.collisionRadius}</Label>
                  </div>
                  <Slider 
                    value={[simulationSettings.collisionRadius]}
                    min={5}
                    max={100}
                    step={1}
                    onValueChange={(value) => 
                      setSimulationSettings({...simulationSettings, collisionRadius: value[0]})
                    }
                  />
                </div>
                
                {/* Show labels */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="showLabels">Show Labels</Label>
                  <Switch 
                    id="showLabels" 
                    checked={simulationSettings.showLabels}
                    onCheckedChange={(checked) => 
                      setSimulationSettings({...simulationSettings, showLabels: checked})
                    }
                  />
                </div>
                
                {/* Reset button */}
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setSimulationSettings({
                    linkDistance: 100,
                    charge: -300,
                    collisionRadius: 30,
                    similarityThreshold: 0.5,
                    showLabels: true,
                    nodeGroupFilter: 'all',
                    forceManyBody: -300,
                  })}
                >
                  Reset Controls
                </Button>
              </TabsContent>
              
              <TabsContent value="details" className="pt-4">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Badge
                        style={{ 
                          backgroundColor: d3.scaleOrdinal(d3.schemeCategory10)(selectedNode.group) as string 
                        }}
                      >
                        {selectedNode.group}
                      </Badge>
                      <h3 className="text-lg font-semibold">{selectedNode.label}</h3>
                      <p className="text-sm text-muted-foreground break-all">
                        ID: {selectedNode.id}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Significance:</div>
                      <div className="font-medium">{(selectedNode.significance || 1).toFixed(2)}</div>
                    </div>
                    
                    {/* Connected nodes */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Connected Nodes</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredLinks
                          .filter(link => {
                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                            return sourceId === selectedNode.id || targetId === selectedNode.id;
                          })
                          .map((link, i) => {
                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                            
                            // Find the connected node (not the selected one)
                            const connectedNodeId = sourceId === selectedNode.id ? targetId : sourceId;
                            const connectedNode = filteredNodes.find(n => n.id === connectedNodeId);
                            
                            if (!connectedNode) return null;
                            
                            return (
                              <div 
                                key={i} 
                                className="text-sm p-1 rounded cursor-pointer hover:bg-slate-100"
                                onClick={() => setSelectedNode(connectedNode)}
                              >
                                <div className="font-medium">{connectedNode.label}</div>
                                <div className="text-xs text-muted-foreground flex justify-between">
                                  <span>{link.relationship}</span>
                                  <span>Similarity: {link.similarity.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a node to see details
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )};

  export default EmbeddingsGraph;