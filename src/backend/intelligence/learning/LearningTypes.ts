import type { Department } from "../../agents/departments/types";

export interface AgentPerformanceMetrics {
  agentId: string;
  department: Department;
  totalTasks: number;
  successRate: number;
  averageQAScore: number;
  averageReflectionIterations: number;
  humanOverrideRate: number;
  trend: "improving" | "stable" | "degrading";
}

export interface PromptVersion {
  id: string;
  agentId: string;
  versionNumber: number;
  systemPrompt: string;
  fewShotExamples: string[];
  status: "stable" | "canary" | "archived";
  performanceMetrics: AgentPerformanceMetrics;
  createdAt: Date;
  replacedAt?: Date;
}

export interface LearningCycle {
  id: string;
  agentId: string;
  trigger: "scheduled" | "performance_drop" | "manual";
  previousVersionId: string;
  proposedVersionId: string;
  status: "analyzing" | "optimizing" | "pending_approval" | "deployed" | "rolled_back";
  reasoning: string;
  createdAt: Date;
}