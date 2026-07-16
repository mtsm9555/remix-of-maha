import type { Department } from "../../agents/departments/types";

export interface AgentNetworkConfig {
  host: string;
  port: number;
  protocol: "http" | "grpc";
  executionEndpoint: string;
}

export interface AgentCapabilities {
  tools: string[];
  models: string[];
  languages: string[];
  maxContextTokens: number;
}

export type AgentRegistryStatus = "healthy" | "degraded" | "unreachable" | "offline";

export interface AgentMetadata {
  instanceId: string;
  agentType: string;
  department: Department;
  network: AgentNetworkConfig;
  capabilities: AgentCapabilities;
  currentLoad: number;
  maxConcurrentTasks: number;
  registeredAt: Date;
  lastHeartbeat: Date;
  status: AgentRegistryStatus;
}

export interface DiscoveryQuery {
  requiredDepartment?: Department;
  requiredTools?: string[];
  requiredModel?: string;
  maxLoadThreshold?: number;
}

export const HEARTBEAT_TTL_SECONDS = 120;