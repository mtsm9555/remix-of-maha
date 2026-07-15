export interface GraphNode {
  id: string;
  label: string;
  name: string;
  embedding?: number[];
  properties?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  properties?: Record<string, any>;
}

export interface TraversalResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  path?: string[];
}