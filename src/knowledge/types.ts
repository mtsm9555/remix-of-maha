export interface Entity {
  id: string;
  name: string;
  type: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  confidence: number;
  createdAt: Date;
}

export interface GraphNode {
  entity: Entity;
}

export interface GraphEdge {
  relationship: Relationship;
}