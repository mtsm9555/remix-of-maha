import type { Department } from "../../agents/departments/types";

export interface AgentProfile {
  instanceId: string;
  agentType: string;
  department: Department;
  capabilityEmbedding: number[];
  supportedTools: string[];
  trustScore: number;
  totalTasksCompleted: number;
  humanOverrideRate: number;
  currentLoad: number;
  status: "healthy" | "degraded" | "unreachable";
  costPerTaskUSD: number;
  endpoint: string;
}

export type RoutingStrategy = "optimal" | "fastest" | "cheapest" | "highest_trust";

export interface TaskRoutingRequest {
  taskDescription: string;
  taskEmbedding: number[];
  requiredDepartment?: Department;
  requiredTools?: string[];
  strategy: RoutingStrategy;
  maxBudgetUSD?: number;
  minTrustScore?: number;
}

export interface DiscoveryResult {
  selectedAgent: AgentProfile;
  routingScore: number;
  reasoning: string;
  estimatedLatencyMs: number;
  estimatedCostUSD: number;
}