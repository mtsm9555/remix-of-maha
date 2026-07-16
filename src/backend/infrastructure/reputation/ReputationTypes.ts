import type { Department } from "../../agents/departments/types";

export type TrustLevel = "UNTRUSTED" | "NOVICE" | "TRUSTED" | "ELITE" | "SUSPENDED";

export interface ReputationMetrics {
  successRate: number;
  averageQAScore: number;
  humanOverrideRate: number;
  budgetAdherence: number;
  slaCompliance: number;
  selfCorrectionRate: number;
}

export interface ReputationScore {
  agentId: string;
  department: Department;
  compositeScore: number;
  trustLevel: TrustLevel;
  trend: "rising" | "stable" | "falling";
  totalTasksEvaluated: number;
  lastUpdated: Date;
}

export type ReputationEventType =
  | "TASK_SUCCESS"
  | "TASK_FAILURE"
  | "QA_REJECTED"
  | "HUMAN_OVERRIDE"
  | "BUDGET_OVERUN"
  | "SLA_MISS";

export interface ReputationEvent {
  id: string;
  agentId: string;
  eventType: ReputationEventType;
  severity: "low" | "medium" | "high" | "critical";
  scoreImpact: number;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface RawReputationEventInput {
  agentId: string;
  type: ReputationEventType;
  severity: "low" | "medium" | "high" | "critical";
  department?: Department;
  metadata?: Record<string, unknown>;
}