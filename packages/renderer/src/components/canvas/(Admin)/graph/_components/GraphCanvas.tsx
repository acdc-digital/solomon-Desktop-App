// GRAPH CANVAS
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Admin)/graph/_components/GraphCanvas.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomControls } from './ZoomControls';
import { useGraphStore } from '@/lib/store/graphStore';

export interface GraphNode {
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

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  similarity: number;
  relationship: string;
}

export interface SimulationSettings {
  linkDistance: number;
  forceManyBody: number;
  collisionRadius: number;
  similarityThreshold: number;
  showLabels: boolean;
  nodeGroupFilter: string;
}

export interface GraphCanvasProps {
  width: number;
  height: number;
  nodes: GraphNode[];
  links: GraphLink[];
  simulationSettings: SimulationSettings;
  onNodeHover: (node: GraphNode | null) => void;
  onNodeSelect: (node: GraphNode) => void;
  hoveredNode?: GraphNode | null;
  selectedNode?: GraphNode | null;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  width,
  height,
  nodes,
  links,
  simulationSettings,
  onNodeHover,
  onNodeSelect,
  hoveredNode,
  selectedNode
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, d3.SimulationLinkDatum<GraphNode>> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  const { zoomState, updateZoomState, resetZoom } = useGraphStore();

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
      const transform = d3.zoomTransform(svgRef.current);
      updateZoomState({
        scale: transform.k,
        translateX: transform.x,
        translateY: transform.y
      });
    }
  }, [updateZoomState]);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
      const transform = d3.zoomTransform(svgRef.current);
      updateZoomState({
        scale: transform.k,
        translateX: transform.x,
        translateY: transform.y
      });
    }
  }, [updateZoomState]);

  const handleResetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
      resetZoom();
    }
  }, [resetZoom]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) {
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    // Stop any existing simulation.
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create a main group for zoom and pan.
    const g = svg.append('g');
    gRef.current = g;

    // Setup zoom behavior.
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        updateZoomState({
          scale: event.transform.k,
          translateX: event.transform.x,
          translateY: event.transform.y
        });
      });
    svg.call(zoomBehavior as any);
    zoomRef.current = zoomBehavior;
    if (zoomState) {
      const storedTransform = d3.zoomIdentity
        .translate(zoomState.translateX, zoomState.translateY)
        .scale(zoomState.scale);
      svg.call(zoomBehavior.transform, storedTransform);
    }

    // Create color scale.
    const uniqueGroups = Array.from(new Set(nodes.map(n => n.group)));
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueGroups);

    // Copy nodes and create a lookup map.
    const nodesCopy = nodes.map(node => ({ ...node }));
    const nodeMap = new Map<string, GraphNode>();
    nodesCopy.forEach(node => nodeMap.set(node.id, node));

    // Create D3-compatible links.
    const d3Links: any[] = [];
    for (const link of links) {
      const sourceNode = nodeMap.get(typeof link.source === 'string' ? link.source : link.source.id);
      const targetNode = nodeMap.get(typeof link.target === 'string' ? link.target : link.target.id);
      if (sourceNode && targetNode) {
        d3Links.push({
          source: sourceNode,
          target: targetNode,
          similarity: link.similarity,
          relationship: link.relationship
        });
      }
    }

    // Setup force simulation.
    const simulation = d3.forceSimulation<GraphNode>(nodesCopy)
      .force('link', d3.forceLink<GraphNode, d3.SimulationLinkDatum<GraphNode>>(d3Links)
        .id(d => d.id)
        .distance(simulationSettings.linkDistance))
      .force('charge', d3.forceManyBody().strength(simulationSettings.forceManyBody))
      .force('collision', d3.forceCollide().radius(simulationSettings.collisionRadius))
      .force('center', d3.forceCenter(width / 2, height / 2));
    simulationRef.current = simulation;

    // Render links with enhanced styling.
    const linkSelection = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(d3Links)
      .enter()
      .append('line')
      .attr('stroke-width', (d: any) => Math.max(1, d.similarity * 5))
      .attr('stroke', (d: any) => {
        switch (d.relationship) {
          case 'strong': return '#1a73e8';
          case 'similar': return '#34a853';
          case 'related': return '#fbbc05';
          case 'weak': return '#ea4335';
          default: return '#999';
        }
      })
      .attr('stroke-opacity', (d: any) => Math.max(0.3, Math.min(0.9, d.similarity)))
      .attr('stroke-dasharray', (d: any) => d.relationship === 'weak' ? '3,3' : null);

    // Add directional marker definition.
    g.append('defs').selectAll('marker')
      .data(['arrow'])
      .enter().append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Add link titles.
    linkSelection.append('title')
      .text((d: any) => {
        const source = d.source.label;
        const target = d.target.label;
        return `${source} → ${target}: ${d.similarity.toFixed(2)} (${d.relationship})`;
      });

    // Render nodes with enhanced styling.
    const nodeSelection = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodesCopy)
      .enter()
      .append('circle')
      .attr('r', d => Math.max(5, (d.significance || 1) * 3 + 5))
      .attr('fill', d => colorScale(d.group) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('filter', 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))')
      .on('click', (event, d) => {
        onNodeSelect(d);
        event.stopPropagation();
      })
      .on('mouseover', (event, d) => {
        onNodeHover(d);
        // Enlarge hovered node.
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr('r', (d: any) => Math.max(7, (d.significance || 1) * 3 + 7))
          .attr('stroke', '#000')
          .attr('stroke-width', 2);
        // Highlight connected links.
        linkSelection
          .transition().duration(200)
          .attr('stroke-opacity', (link: any) => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            return (sourceId === d.id || targetId === d.id)
              ? Math.max(0.8, link.similarity)
              : 0.1;
          })
          .attr('stroke-width', (link: any) => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            return (sourceId === d.id || targetId === d.id)
              ? Math.max(2, link.similarity * 6)
              : Math.max(0.5, link.similarity * 2);
          });
        // Highlight connected nodes.
        nodeSelection
          .transition().duration(200)
          .attr('opacity', (node: any) => {
            const isConnected = d3Links.some((link: any) => {
              const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
              const targetId = typeof link.target === 'string' ? link.target : link.target.id;
              return (sourceId === d.id && targetId === node.id) ||
                     (targetId === d.id && sourceId === node.id);
            });
            return node.id === d.id || isConnected ? 1 : 0.3;
          });
        // Show label popup.
        const popup = g.append('g')
          .attr('class', 'node-popup')
          .attr('transform', `translate(${d.x + 15}, ${d.y - 15})`);
        popup.append('rect')
          .attr('rx', 5)
          .attr('ry', 5)
          .attr('width', d.label.length * 7 + 20)
          .attr('height', 30)
          .attr('fill', 'white')
          .attr('stroke', colorScale(d.group) as string)
          .attr('stroke-width', 2)
          .style('filter', 'drop-shadow(0px 3px 5px rgba(0,0,0,0.2))');
        popup.append('text')
          .attr('x', 10)
          .attr('y', 20)
          .text(d.label)
          .attr('font-size', 12)
          .attr('fill', '#333');
      })
      .on('mouseout', (event, d) => {
        onNodeHover(null);
        // Revert node styling.
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr('r', (d: any) => Math.max(5, (d.significance || 1) * 3 + 5))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);
        nodeSelection.transition().duration(200).attr('opacity', 1);
        linkSelection.transition().duration(200)
          .attr('stroke-opacity', (d: any) => Math.max(0.3, d.similarity))
          .attr('stroke-width', (d: any) => Math.max(1, d.similarity * 5));
        g.selectAll('.node-popup').remove();
      })
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );
      
    // Append node titles.
    nodeSelection.append('title')
      .text(d => d.label);

    // Enhanced label rendering (backgrounds for readability).
    if (simulationSettings.showLabels) {
      const labelGroup = g.append('g')
        .attr('class', 'labels')
        .selectAll('g')
        .data(nodesCopy)
        .enter()
        .append('g');

      // Background rectangles.
      labelGroup.append('rect')
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 0.5);
      
      const labels = labelGroup.append('text')
        .text(d => d.label.length > 20 ? d.label.substring(0, 17) + '...' : d.label)
        .attr('font-size', 10)
        .attr('font-weight', 'medium')
        .attr('dy', 3);
      
      // Position background based on text dimensions.
      labels.each(function(this: SVGTextElement, d: any) {
        const bbox = this.getBBox();
        const rect = d3.select(this.previousSibling as SVGRectElement);
        rect.attr('x', bbox.x - 2)
            .attr('y', bbox.y - 1)
            .attr('width', bbox.width + 4)
            .attr('height', bbox.height + 2);
      });
      
      // Update positions on simulation tick.
      simulation.on('tick', () => {
        linkSelection
          .attr('x1', (d: any) => d.source.x || 0)
          .attr('y1', (d: any) => d.source.y || 0)
          .attr('x2', (d: any) => d.target.x || 0)
          .attr('y2', (d: any) => d.target.y || 0);
          
        nodeSelection
          .attr('cx', (d) => d.x || 0)
          .attr('cy', (d) => d.y || 0);
          
        labelGroup
          .attr('transform', (d: any) => `translate(${(d.x || 0) + 15},${(d.y || 0) - 10})`);
      });
    }

    // Background click to deselect node.
    svg.on('click', () => onNodeSelect(null as any));

    simulation.alpha(1).restart();

    return () => {
      if (simulation) simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, simulationSettings, width, height, updateZoomState]);

  // Drag handlers.
  function dragstarted(event: any, d: GraphNode) {
    if (!event.active && simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event: any, d: GraphNode) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragended(event: any, d: GraphNode) {
    if (!event.active && simulationRef.current) {
      simulationRef.current.alphaTarget(0);
    }
    d.fx = event.x;
    d.fy = event.y;
  }

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="block"
        style={{ background: 'white' }}
      />
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetZoom}
      />
    </div>
  );
};

export default GraphCanvas;