// GRAPH CANVAS
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Admin)/graph/_components/GraphCanvas.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomControls } from './ZoomControls';
import { useGraphStore, ZoomState } from '@/lib/store/graphStore';

// Types you might import from a separate "types.ts" or define inline
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

  // Callbacks for interactivity
  onNodeHover: (node: GraphNode | null) => void;
  onNodeSelect: (node: GraphNode) => void;

  // Current states for hovered/selected nodes (so we can style them)
  hoveredNode?: GraphNode | null;
  selectedNode?: GraphNode | null;
}

/**
 * GraphCanvas
 * ----------
 * A presentational component that uses D3 to:
 *  - render nodes & links
 *  - setup a force simulation
 *  - handle user interactions (hover, click, drag)
 */
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
  
  // Get zoom state and update function from the store
  const { zoomState, updateZoomState, resetZoom } = useGraphStore();
  
  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      // Apply zoom
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        zoomRef.current.scaleBy, 1.3
      );
      
      // Get the new transform and update the store
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
      // Apply zoom
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        zoomRef.current.scaleBy, 0.7
      );
      
      // Get the new transform and update the store
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
      // Apply zoom reset
      const svg = d3.select(svgRef.current);
      svg.transition().duration(500).call(
        zoomRef.current.transform, d3.zoomIdentity
      );
      
      // Reset the zoom state in the store
      resetZoom();
    }
  }, [resetZoom]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) {
      // If no nodes, clear the SVG
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    // Stop any existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // 1. Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 2. Create a main <g> that we will zoom & pan
    const g = svg.append('g');
    gRef.current = g;

    // 3. Setup zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        // Apply transform to the group element
        g.attr('transform', event.transform);
        
        // Store the current zoom state
        updateZoomState({
          scale: event.transform.k,
          translateX: event.transform.x,
          translateY: event.transform.y
        });
      });

    svg.call(zoomBehavior as any);
    zoomRef.current = zoomBehavior;
    
    // Apply stored zoom state if it exists
    if (zoomState) {
      const storedTransform = d3.zoomIdentity
        .translate(zoomState.translateX, zoomState.translateY)
        .scale(zoomState.scale);
      
      svg.call(zoomBehavior.transform, storedTransform);
    }

    // 4. Create color scale for groups
    const uniqueGroups = Array.from(new Set(nodes.map(n => n.group)));
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(uniqueGroups);

    // 5. Copy nodes to avoid mutating the original
    const nodesCopy = nodes.map(node => ({ ...node }));
    
    // Create a map of nodes by ID for quick lookup
    const nodeMap = new Map<string, GraphNode>();
    nodesCopy.forEach(node => {
      nodeMap.set(node.id, node);
    });

    // 6. Create D3-compatible links that use node references
    const d3Links = [];
    for (const link of links) {
      const sourceNode = nodeMap.get(typeof link.source === 'string' ? link.source : link.source.id);
      const targetNode = nodeMap.get(typeof link.target === 'string' ? link.target : link.target.id);
      
      // Only create links when both nodes exist
      if (sourceNode && targetNode) {
        d3Links.push({
          source: sourceNode,
          target: targetNode,
          similarity: link.similarity,
          relationship: link.relationship
        });
      }
    }

    // 7. Setup force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodesCopy)
      .force(
        'link',
        d3.forceLink<GraphNode, d3.SimulationLinkDatum<GraphNode>>(d3Links)
          .id((d) => d.id)
          .distance(simulationSettings.linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(simulationSettings.forceManyBody))
      .force('collision', d3.forceCollide().radius(simulationSettings.collisionRadius))
      .force('center', d3.forceCenter(width / 2, height / 2));

    simulationRef.current = simulation;

    // 8. Render links
    const linkSelection = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(d3Links)
      .enter()
      .append('line')
      .attr('stroke-width', (d: any) => Math.max(1, d.similarity * 5))
      .attr('stroke', (d: any) => {
        // Basic color logic by relationship, fallback to a grey
        if (d.relationship === 'strong') return '#4a9eff';
        if (d.relationship === 'similar') return '#66bb6a';
        if (d.relationship === 'group') return '#8e44ad';
        if (d.relationship === 'structural') return '#e74c3c';
        if (d.relationship === 'auto-generated') return '#f39c12';
        if (d.similarity > 0.7) return '#5c6bc0';
        return '#999';
      })
      .attr('stroke-opacity', (d: any) => Math.max(0.3, d.similarity))
      .attr('stroke-dasharray', (d: any) =>
        d.relationship === 'weak' || d.relationship === 'auto-generated'
          ? '3,3'
          : null
      );

    // Add link titles
    linkSelection.append('title')
      .text((d: any) => {
        const source = d.source.label;
        const target = d.target.label;
        return `${source} → ${target}: ${d.similarity.toFixed(2)} (${d.relationship})`;
      });

    // 9. Render nodes
    const nodeSelection = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodesCopy)
      .enter()
      .append('circle')
      .attr('r', (d) => Math.max(5, (d.significance || 1) * 3 + 5))
      .attr('fill', (d) => colorScale(d.group) as string)
      .on('click', (event, d) => {
        onNodeSelect(d);
        event.stopPropagation();
      })
      .on('mouseover', (event, d) => {
        onNodeHover(d);
        // highlight the hovered node
        d3.select(event.currentTarget)
          .attr('stroke', '#000')
          .attr('stroke-width', 2);

        // highlight connected links
        linkSelection
          .attr('stroke-opacity', (link: any) => {
            return (link.source.id === d.id || link.target.id === d.id)
              ? Math.max(0.8, link.similarity)
              : 0.1;
          })
          .attr('stroke-width', (link: any) => {
            return (link.source.id === d.id || link.target.id === d.id)
              ? Math.max(2, link.similarity * 6)
              : Math.max(0.5, link.similarity * 2);
          });

        // highlight connected nodes
        nodeSelection
          .attr('opacity', (node) => {
            const isConnected = d3Links.some((link: any) => 
              (link.source.id === d.id && link.target.id === node.id) || 
              (link.target.id === d.id && link.source.id === node.id)
            );
            return node.id === d.id || isConnected ? 1 : 0.3;
          });
      })
      .on('mouseout', () => {
        onNodeHover(null);
        nodeSelection
          .attr('stroke', null)
          .attr('stroke-width', null)
          .attr('opacity', 1);

        linkSelection
          .attr('stroke-opacity', (d: any) => Math.max(0.3, d.similarity))
          .attr('stroke-width', (d: any) => Math.max(1, d.similarity * 5));
      })
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // Node titles
    nodeSelection.append('title')
      .text((d) => d.label);

    // 10. Optionally render labels if showLabels = true
    if (simulationSettings.showLabels) {
      g.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(nodesCopy)
        .enter()
        .append('text')
        .text((d) =>
          d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label
        )
        .attr('font-size', 10)
        .attr('dx', 12)
        .attr('dy', 4)
        .style('pointer-events', 'none');
    }

    // On each tick, update positions
    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d: any) => d.source.x || 0)
        .attr('y1', (d: any) => d.source.y || 0)
        .attr('x2', (d: any) => d.target.x || 0)
        .attr('y2', (d: any) => d.target.y || 0);

      nodeSelection
        .attr('cx', (d) => d.x || 0)
        .attr('cy', (d) => d.y || 0);

      if (simulationSettings.showLabels) {
        g.selectAll('.labels text')
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y);
      }
    });

    // Background click to deselect node
    svg.on('click', () => {
      onNodeSelect(null as any);
    });

    // Start the simulation
    simulation.alpha(1).restart();

    // Cleanup on unmount
    return () => {
      if (simulation) {
        simulation.stop();
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, simulationSettings, width, height, updateZoomState]);

  // Drag handlers
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
    // Keep node fixed at its new position
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
        style={{ background: 'white' /* or transparent */ }}
      />
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetZoom}
      />
    </div>
  );
};