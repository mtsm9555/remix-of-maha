export type WorkerStatus = "initializing" | "idle" | "busy" | "draining" | "offline" | "failed";
export type TaskPriority = "critical" | "high" | "normal" | "low";
export type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "cancelled";

export interface WorkerNode {
  id: string;
  hostname: string;
  ipAddress: string;
  region: string;
  zone: string;
  capabilities: string[];
  maxConcurrentTasks: number;
  currentTaskCount: number;
  cpuCores: number;
  memoryGB: number;
  diskGB: number;
  status: WorkerStatus;
  loadAverage: number;
  cpuUsage: number;
  memoryUsage: number;
  version: string;
  startedAt: Date;
  lastHeartbeatAt: Date;
  metadata: Record<string, unknown>;
}

export interface ClusterTask {
  id: string;
  type: string;
  priority: TaskPriority;
  requiredCapabilities: string[];
  preferredRegion?: string;
  preferredWorkerId?: string;
  payload: Record<string, unknown>;
  status: TaskStatus;
  assignedWorkerId?: string;
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
  timeoutMs: number;
  result?: unknown;
  error?: string;
  tenantId: string;
  workspaceId?: string;
  metadata: Record<string, unknown>;
}

export interface ClusterMetrics {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  failedWorkers: number;
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageLoad: number;
  regionMetrics: Record<string, { workers: number; tasks: number; load: number }>;
}

export interface WorkerHealthCheck {
  workerId: string;
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatencyMs: number;
  activeTasks: number;
  errors: string[];
}