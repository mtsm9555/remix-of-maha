import type { Department } from "../../agents/departments/types";

export type BudgetResourceType = "llm_tokens" | "tool_execution" | "api_calls" | "financial";
export type BudgetDecisionStatus = "allowed" | "warning" | "blocked" | "requires_approval";

export interface CostMetrics {
  llmTokens: number;
  llmCostUSD: number;
  toolExecutions: number;
  toolCostUSD: number;
  apiCalls: number;
  apiCostUSD: number;
  totalCostUSD: number;
}

export interface AgentBudgetConfig {
  agentId: string;
  department: Department;
  limits: {
    hourly: CostMetrics;
    daily: CostMetrics;
    monthly: CostMetrics;
  };
}

export interface BudgetTransaction {
  id: string;
  agentId: string;
  department: Department;
  resourceType: BudgetResourceType;
  amount: number;
  costUSD: number;
  metadata: {
    modelName?: string;
    toolName?: string;
    taskId?: string;
    timestamp: Date;
  };
}

export interface BudgetDecision {
  status: BudgetDecisionStatus;
  reason?: string;
  currentUsage: CostMetrics;
  limit: CostMetrics;
}