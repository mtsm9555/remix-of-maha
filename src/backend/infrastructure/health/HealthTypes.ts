export interface HealthTelemetry {
  instanceId: string;
  timestamp: Date;
  cpuUsagePercent: number;
  memoryUsageMB: number;
  memoryLimitMB: number;
  llmAverageLatencyMs: number;
  llmErrorRate: number;
  tokenBurnRatePerMin: number;
  activeTaskCount: number;
  queueDepth: number;
  successRate: number;
  budgetSpendRatePerHour: number;
}

export interface HealthScore {
  instanceId: string;
  overallScore: number;
  systemScore: number;
  cognitiveScore: number;
  status: "healthy" | "degraded" | "critical" | "offline";
  calculatedAt: Date;
}

export interface HealthAnomaly {
  id: string;
  instanceId: string;
  metricName: string;
  currentValue: number;
  expectedBaseline: number;
  severity: "warning" | "critical";
  description: string;
  detectedAt: Date;
}