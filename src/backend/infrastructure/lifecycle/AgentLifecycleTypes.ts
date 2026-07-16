import type { Department } from "../../agents/departments/types";

export type AgentInstanceState =
  | "INITIALIZING"
  | "IDLE"
  | "WORKING"
  | "DRAINING"
  | "PAUSED"
  | "UNHEALTHY"
  | "DESTROYED";

export interface AgentInstanceConfig {
  agentId: string;
  department: Department;
  maxConcurrentTasks: number;
  maxIdleTimeMinutes: number;
  maxTaskDurationMinutes: number;
}

export interface AgentInstance {
  instanceId: string;
  config: AgentInstanceConfig;
  state: AgentInstanceState;
  currentTaskId?: string;
  taskStartTime?: Date;
  tasksCompleted: number;
  consecutiveErrors: number;
  createdAt: Date;
  stateChangedAt: Date;
  lastHeartbeat: Date;
}

export interface LifecycleEvent {
  id: string;
  instanceId: string;
  fromState: AgentInstanceState;
  toState: AgentInstanceState;
  reason: string;
  timestamp: Date;
}