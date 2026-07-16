import type { Department } from "../../agents/departments/types";

export interface InferredRelationship {
  sourceEntity: string;
  targetEntity: string;
  inferredRelation: string;
  confidenceScore: number;
  reasoning: string;
}

export interface EntityCluster {
  primaryEntity: string;
  aliases: string[];
  department: Department;
}

export interface GraphExpansionJob {
  id: string;
  department: Department;
  type: "entity_resolution" | "relationship_inference" | "cluster_discovery";
  status: "pending" | "processing" | "completed" | "failed";
  nodesProcessed: number;
  newEdgesCreated: number;
  duplicatesMerged: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
