// GRAPH CANVAS
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Admin)/graph/_components/GraphCanvas.tsx

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

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
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) {
      // If no nodes, clear the SVG
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    // 1. Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 2. Create a main <g> that we will zoom & pan
    const g = svg.append('g');

    // 3. Setup zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior as any);

    // 4. Create color scale for groups
    const uniqueGroups = Array.from(new Set(nodes.map(n => n.group)));
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(uniqueGroups);

    // 5. Render links
    const linkSelection = g.append('g')
      .attr('class', 'links')
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', (d) => Math.max(1, d.similarity * 5))
      .attr('stroke', (d) => {
        // Basic color logic by relationship, fallback to a grey
        if (d.relationship === 'strong') return '#4a9eff';
        if (d.relationship === 'similar') return '#66bb6a';
        if (d.relationship === 'group') return '#8e44ad';
        if (d.relationship === 'structural') return '#e74c3c';
        if (d.relationship === 'auto-generated') return '#f39c12';
        if (d.similarity > 0.7) return '#5c6bc0';
        return '#999';
      })
      .attr('stroke-opacity', (d) => Math.max(0.3, d.similarity))
      .attr('stroke-dasharray', (d) =>
        d.relationship === 'weak' || d.relationship === 'auto-generated'
          ? '3,3'
          : null
      );

    // Add link titles
    linkSelection.append('title')
      .text((d) => {
        const source = typeof d.source === 'object' ? d.source.label : d.source;
        const target = typeof d.target === 'object' ? d.target.label : d.target;
        return `${source} → ${target}: ${d.similarity.toFixed(2)} (${d.relationship})`;
      });

    // 6. Render nodes
    const nodeSelection = g.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
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
          .attr('stroke-opacity', (link) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return (sourceId === d.id || targetId === d.id)
              ? Math.max(0.8, link.similarity)
              : 0.1;
          })
          .attr('stroke-width', (link) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return (sourceId === d.id || targetId === d.id)
              ? Math.max(2, link.similarity * 6)
              : Math.max(0.5, link.similarity * 2);
          });

        // highlight connected nodes
        nodeSelection
          .attr('opacity', (node) => {
            const isConnected = links.some((link) => {
              const s = typeof link.source === 'object' ? link.source.id : link.source;
              const t = typeof link.target === 'object' ? link.target.id : link.target;
              return (s === d.id && t === node.id) || (t === d.id && s === node.id);
            });
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
          .attr('stroke-opacity', (d) => Math.max(0.3, d.similarity))
          .attr('stroke-width', (d) => Math.max(1, d.similarity * 5));
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

    // 7. Optionally render labels if showLabels = true
    if (simulationSettings.showLabels) {
      g.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(nodes)
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

    // 8. Setup force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3.forceLink<GraphNode, GraphLink>(links)
          .id((d: any) => d.id)
          .distance(simulationSettings.linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(simulationSettings.forceManyBody))
      .force('collision', d3.forceCollide().radius(simulationSettings.collisionRadius))
      .force('center', d3.forceCenter(width / 2, height / 2));

    simulationRef.current = simulation;

    // On each tick, update positions
    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d) => (d.source as GraphNode).x || 0)
        .attr('y1', (d) => (d.source as GraphNode).y || 0)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).y || 0);

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
      onNodeSelect(null as any); // or pass null if your callback can handle it
    });

    // Cleanup on unmount
    return () => {
      simulation.stop();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, simulationSettings, width, height]);

  // 9. Update forces if simulationSettings changes
  useEffect(() => {
    if (!simulationRef.current) return;
    simulationRef.current
      .force(
        'link',
        d3.forceLink<GraphNode, GraphLink>(links)
          .id((d: any) => d.id)
          .distance(simulationSettings.linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(simulationSettings.forceManyBody))
      .force('collision', d3.forceCollide().radius(simulationSettings.collisionRadius))
      .alpha(0.3)
      .restart();
  }, [
    simulationSettings.linkDistance,
    simulationSettings.forceManyBody,
    simulationSettings.collisionRadius,
    links
  ]);

  // 10. Drag handlers
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
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      className="block"
      style={{ background: 'white' /* or transparent */ }}
    />
  );
};