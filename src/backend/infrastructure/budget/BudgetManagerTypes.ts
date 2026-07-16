import type { Department } from "../../agents/departments/types";

export type ThrottleState = "NORMAL" | "THROTTLED" | "PAUSED" | "INSUFFICIENT_FUNDS";

export interface AgentInstanceWallet {
  instanceId: string;
  agentType: string;
  department: Department;
  currentBalanceUSD: number;
  initialAllocationUSD: number;
  totalSpentUSD: number;
  throttleState: ThrottleState;
  lastTopUpAt?: Date;
  updatedAt: Date;
}

export type ResourceType = "llm_tokens" | "tool_execution" | "api_call" | "top_up";

export interface MicroTransaction {
  id: string;
  instanceId: string;
  agentType: string;
  department: Department;
  amountUSD: number;
  resourceType: ResourceType;
  referenceId: string;
  balanceAfter: number;
  timestamp: Date;
}

export interface TopUpRequest {
  id: string;
  instanceId: string;
  requestedAmountUSD: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: Date;
}