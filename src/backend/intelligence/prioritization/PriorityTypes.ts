import type { Department } from "../../agents/departments/types";

export type PriorityTier = "critical" | "high" | "medium" | "low";

export interface PriorityFactors {
  urgencyScore: number;
  strategicValue: number;
  unblockFactor: number;
  resourceReadiness: number;
  riskScore: number;
}

export interface TaskPriorityScore {
  taskId: string;
  milestoneId: string;
  department: Department;
  finalScore: number;
  tier: PriorityTier;
  factors: PriorityFactors;
  lastCalculatedAt: Date;
}

export interface PrioritizationContext {
  currentTimestamp: Date;
  activeIncidents: string[];
  globalResourceLoad: Record<Department, number>;
}
