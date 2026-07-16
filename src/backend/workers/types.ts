// src/backend/workers/types.ts

export type JobType =
  | "tool_execution"
  | "memory_consolidation"
  | "workflow_execution"
  | "agent_task"
  | "llm_inference";

export interface WorkerJob<T = any> {
  id: string;
  type: JobType;
  payload: T;
  priority: "low" | "normal" | "high" | "critical";
  userId: string;
  correlationId: string;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface JobResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  executionTimeMs: number;
}

export interface WorkerMetrics {
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgExecutionTime: number;
  queueDepth: Record<JobType, number>;
}