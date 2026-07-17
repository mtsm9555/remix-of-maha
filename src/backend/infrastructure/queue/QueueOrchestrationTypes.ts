export type QueueType = "critical" | "normal" | "background" | "batch" | "scheduled";
export type TaskState =
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "dead_letter"
  | "cancelled"
  | "blocked";
export type RetryStrategy = "exponential_backoff" | "linear_backoff" | "fixed_delay" | "none";
export type PriorityLevel = 1 | 2 | 3 | 4 | 5;

export interface Queue {
  id: string;
  name: string;
  type: QueueType;
  description?: string;
  maxConcurrentTasks: number;
  defaultTimeoutMs: number;
  defaultMaxRetries: number;
  defaultRetryStrategy: RetryStrategy;
  isActive: boolean;
  currentDepth: number;
  processingRate: number;
  failureRate: number;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrchestratedTask {
  id: string;
  queueId: string;
  tenantId: string;
  workspaceId?: string;
  type: string;
  payload: Record<string, any>;
  priority: PriorityLevel;
  state: TaskState;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  queuedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  timeoutMs: number;
  retryStrategy: RetryStrategy;
  retryDelayMs: number;
  nextRetryAt?: Date;
  result?: any;
  error?: string;
  errorCode?: string;
  dependsOn: string[];
  metadata: Record<string, any>;
  correlationId?: string;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: "blocking" | "optional" | "conditional";
  condition?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface DeadLetterTask {
  id: string;
  originalTaskId: string;
  queueId: string;
  tenantId: string;
  type: string;
  payload: Record<string, any>;
  priority: PriorityLevel;
  attempts: number;
  lastError: string;
  lastErrorCode: string;
  failedAt: Date;
  canRetry: boolean;
  retryCount: number;
  maxManualRetries: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface RetryPolicy {
  strategy: RetryStrategy;
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  jitter: boolean;
}

export interface QueueHealthStatus {
  queueId: string;
  status: "healthy" | "degraded" | "critical" | "offline";
  depthHealth: "normal" | "high" | "critical";
  processingHealth: "normal" | "slow" | "stalled";
  failureHealth: "normal" | "elevated" | "critical";
  currentDepth: number;
  processingRate: number;
  failureRate: number;
  averageProcessingTimeMs: number;
  alerts: string[];
  timestamp: Date;
}