export type ScalingDirection = "scale_up" | "scale_down" | "no_change";
export type ScalingTrigger =
  | "cpu"
  | "memory"
  | "queue_depth"
  | "request_rate"
  | "custom_metric"
  | "schedule"
  | "predictive";
export type ScalingStatus = "active" | "paused" | "disabled";
export type CloudProvider = "aws" | "gcp" | "azure" | "kubernetes" | "custom";

export interface TriggerConfig {
  cpuThresholdPercent?: number;
  memoryThresholdPercent?: number;
  queueDepthThreshold?: number;
  queueName?: string;
  requestsPerSecondThreshold?: number;
  customMetricName?: string;
  customMetricThreshold?: number;
  scheduleCron?: string;
  scheduledInstances?: number;
  predictionWindowMinutes?: number;
  predictionConfidenceThreshold?: number;
}

export interface ScalingPolicy {
  id: string;
  name: string;
  description?: string;
  targetResourceType: "worker_nodes" | "api_servers" | "database_replicas" | "cache_nodes" | "custom";
  targetResourceId: string;
  minInstances: number;
  maxInstances: number;
  currentInstances: number;
  desiredInstances: number;
  triggers: ScalingTrigger[];
  triggerConfigs: Partial<Record<ScalingTrigger, TriggerConfig>>;
  scaleUpCooldownSeconds: number;
  scaleDownCooldownSeconds: number;
  stabilizationWindowSeconds: number;
  status: ScalingStatus;
  cloudProvider: CloudProvider;
  createdAt: Date;
  updatedAt: Date;
  lastScaledAt?: Date;
}

export interface ScalingMetric {
  id: string;
  policyId: string;
  timestamp: Date;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  queueDepth: number;
  requestsPerSecond: number;
  customMetrics: Record<string, number>;
  currentInstances: number;
  desiredInstances: number;
}

export interface ScalingEvent {
  id: string;
  policyId: string;
  direction: ScalingDirection;
  trigger: ScalingTrigger;
  instancesBefore: number;
  instancesAfter: number;
  reason: string;
  metricValue: number;
  thresholdValue: number;
  status: "initiated" | "in_progress" | "completed" | "failed" | "rolled_back";
  initiatedAt: Date;
  completedAt?: Date;
  error?: string;
  estimatedCostChangeUSD?: number;
  metadata?: Record<string, unknown>;
}

export interface ScalingPrediction {
  id: string;
  policyId: string;
  predictedTimestamp: Date;
  predictedMetricValue: number;
  predictedInstancesNeeded: number;
  confidenceScore: number;
  generatedAt: Date;
}

export interface ScalingRecommendation {
  type: string;
  description: string;
  estimatedSavingsUSD: number;
}

export interface CostOptimization {
  policyId: string;
  currentMonthlyCostUSD: number;
  optimizedMonthlyCostUSD: number;
  potentialSavingsUSD: number;
  recommendations: ScalingRecommendation[];
}