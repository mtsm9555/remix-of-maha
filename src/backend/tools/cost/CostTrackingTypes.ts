export type PricingModelType =
  | "fixed_per_call"
  | "variable_compute"
  | "token_based"
  | "external_api_passthrough";

export interface ToolPricingModel {
  toolName: string;
  modelType: PricingModelType;
  baseCostUSD: number;
  costPerCpuSecondUSD: number;
  costPerMemoryMBSecondUSD: number;
  costPerInputTokenUSD: number;
  costPerOutputTokenUSD: number;
  externalApiEndpoint?: string;
  externalApiCostMultiplier: number;
}

export interface ToolCostEvent {
  id: string;
  timestamp: Date;
  toolName: string;
  agentId: string;
  department: string;
  projectId?: string;
  executionTimeMs: number;
  memoryUsedMB: number;
  tokensUsed?: { input: number; output: number };
  externalApiCalls: number;
  totalCostUSD: number;
  costBreakdown: {
    baseCost: number;
    computeCost: number;
    tokenCost: number;
    externalApiCost: number;
  };
}

export interface CostAttributionRollup {
  periodStart: Date;
  department: string;
  agentId?: string;
  toolName?: string;
  totalCostUSD: number;
  totalExecutions: number;
  estimatedROI: number;
}