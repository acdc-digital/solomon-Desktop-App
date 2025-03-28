// NODE DETAILS PANEL 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Admin)/graph/_components/NodeDetailsPanel.tsx  

import React from 'react'; 
import * as d3 from 'd3'; 
import { Badge } from '@/components/ui/badge';  

// You can import these types from a shared types file if preferred 
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

export interface NodeDetailsPanelProps {   
  selectedNode: GraphNode | null;   
  filteredLinks: GraphLink[];   
  filteredNodes: GraphNode[];   
  onSelectNode: (node: GraphNode) => void; 
}  

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({   
  selectedNode,   
  filteredLinks,   
  filteredNodes,   
  onSelectNode, 
}) => {   
  if (!selectedNode) {     
    return (       
      <div className="text-center py-8 text-muted-foreground">         
        Select a node to see details       
      </div>     
    );   
  }    
  
  // Get node ID for comparison
  const selectedNodeId = selectedNode.id;

  // Filter links to get those connected to the selected node.   
  const connectedLinks = filteredLinks.filter((link) => {     
    // Extract the string IDs, whether source/target are objects or strings
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;     
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;     
    
    // Check if this link connects to our selected node
    return sourceId === selectedNodeId || targetId === selectedNodeId;   
  });    
  
  // From each connected link, find the node that is not the selected one.   
  const connectedNodes = connectedLinks.map((link) => {     
    // Extract the string IDs, whether source/target are objects or strings
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;     
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;     
    
    // Find which end of the link is NOT our selected node
    const connectedNodeId = sourceId === selectedNodeId ? targetId : sourceId;     
    
    // Find the actual node object for this connected node
    const connectedNode = filteredNodes.find((node) => node.id === connectedNodeId);
    
    // Return the connected node and the link that connects them
    return { 
      node: connectedNode, 
      link 
    };
  }).filter(item => item.node) as { node: GraphNode, link: GraphLink }[];    
  
  return (     
    <div className="space-y-4">       
      <div className="space-y-1">         
        <Badge           
          style={{             
            backgroundColor: d3.scaleOrdinal(d3.schemeCategory10)(selectedNode.group) as string,           
          }}         
        >           
          {selectedNode.group}         
        </Badge>         
        <h3 className="text-lg font-semibold">{selectedNode.label}</h3>         
        <p className="text-sm text-muted-foreground break-all">           
          ID: {selectedNode.id}         
        </p>         
        <p className="text-sm text-muted-foreground">           
          Significance: {(selectedNode.significance || 1).toFixed(2)}         
        </p>       
      </div>        
      
      <div className="space-y-2">         
        <h4 className="font-medium">Connected Nodes ({connectedNodes.length})</h4>         
        {connectedNodes.length > 0 ? (           
          <div className="max-h-80 overflow-y-auto space-y-1 border rounded-md border-gray-950">             
            {connectedNodes.map(({node, link}, index) => (               
              <div                 
                key={node.id}                 
                className="p-1 rounded cursor-pointer hover:bg-slate-100"                 
                onClick={() => onSelectNode(node)}               
              >                 
                <div className="font-medium">{node.label}</div>                 
                <div className="text-xs text-muted-foreground flex justify-between">                   
                  <span>{link.relationship}</span>                   
                  <span>Similarity: {link.similarity.toFixed(2)}</span>                 
                </div>               
              </div>             
            ))}           
          </div>         
        ) : (           
          <p className="text-sm text-muted-foreground">No connected nodes found.</p>         
        )}       
      </div>     
    </div>   
  ); 
};