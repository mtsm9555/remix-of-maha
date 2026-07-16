import type { Department } from "../agents/departments/types";

export type GoalStatus = "pending" | "planning" | "executing" | "completed" | "failed";
export type TaskStatus = "pending" | "assigned" | "in_progress" | "completed" | "failed";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Goal {
  id: string;
  userId: string;
  description: string;
  status: GoalStatus;
  subtasks: Subtask[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface Subtask {
  id: string;
  goalId: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId?: string;
  assignedAgentName?: string;
  department?: Department;
  dependencies: string[];
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface ExecutionPlan {
  goalId: string;
  steps: PlanStep[];
  estimatedDuration: number;
  confidence: number;
}

export interface PlanStep {
  order: number;
  subtaskId: string;
  agentId: string;
  agentName: string;
  department: Department;
  estimatedDuration: number;
  dependencies: string[];
}

export interface PlanningContext {
  userId: string;
  availableAgents: string[];
  departmentCapabilities: Record<Department, string[]>;
  previousGoals?: Goal[];
}