import type { Department } from "../agents/departments/types";

export type PlanStatus =
  | "draft"
  | "validated"
  | "approved"
  | "executing"
  | "completed"
  | "completed_with_failures"
  | "failed";

export type ExecutionWave = number;

export interface ResourceEstimate {
  apiCostUSD: number;
  estimatedAgentHours: number;
  estimatedWallClockMinutes: number;
  tokenUsageEstimate: number;
}

export interface RiskAssessment {
  level: "low" | "medium" | "high" | "critical";
  description: string;
  mitigationStrategy: string;
}

export interface OSMilestone {
  id: string;
  wave: ExecutionWave;
  department: Department;
  objective: string;
  successCriteria: string[];
  dependencies: string[];
  resources: ResourceEstimate;
  risks: RiskAssessment[];
  status: "pending" | "in_progress" | "completed" | "blocked" | "failed";
}

export interface OSPlan {
  id: string;
  goal: string;
  status: PlanStatus;
  milestones: OSMilestone[];
  totalResources: ResourceEstimate;
  criticalPath: string[];
  createdAt: Date;
  approvedBy?: string;
}