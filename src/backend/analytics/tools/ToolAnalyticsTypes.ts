export interface ToolExecutionEvent {
  id: string;
  timestamp: Date;
  toolName: string;
  agentId: string;
  department: string;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  tokensUsed?: number;
  costUSD: number;
  payloadSizeBytes: number;
}

export interface ToolMetricRollup {
  toolName: string;
  periodStart: Date;
  periodEnd: Date;
  totalExecutions: number;
  successRate: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  totalCostUSD: number;
  totalTokensUsed: number;
  errorCounts: Record<string, number>;
}

export interface ToolHealthStatus {
  toolName: string;
  status: "healthy" | "degraded" | "critical" | "unused";
  currentRpm: number;
  errorRate: number;
  avgLatencyMs: number;
}