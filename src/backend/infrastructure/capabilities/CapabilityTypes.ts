import type { Department } from "../../agents/departments/types";

export type Modality = "text" | "image" | "audio" | "video" | "code";

export interface ToolCapability {
  name: string;
  description: string;
  parameterSchema: Record<string, any>;
  isDestructive: boolean;
  requiresApproval: boolean;
}

export interface ModelCapability {
  provider: string;
  modelName: string;
  contextWindowTokens: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  costPerInputTokenUSD: number;
  costPerOutputTokenUSD: number;
}

export interface DomainExpertise {
  domain: string;
  subDomains: string[];
  confidenceScore: number;
}

export interface AgentCapabilityMap {
  agentId: string;
  agentType: string;
  department: Department;
  inputModalities: Modality[];
  outputModalities: Modality[];
  maxConcurrentTasks: number;
  tools: ToolCapability[];
  primaryModel: ModelCapability;
  fallbackModels: ModelCapability[];
  expertise: DomainExpertise[];
  capabilityEmbedding: number[];
  version: string;
  lastUpdated: Date;
}

export interface CapabilitySearchQuery {
  inputModality?: Modality;
  requiredTool?: string;
  department?: Department;
}