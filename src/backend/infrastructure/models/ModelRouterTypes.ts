export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral' | 'cohere' | 'custom';
export type ModelCapability = 'text' | 'vision' | 'code' | 'reasoning' | 'embedding' | 'function_calling' | 'long_context' | 'fast_inference';
export type RoutingStrategy = 'cost_optimized' | 'performance_optimized' | 'balanced' | 'custom';
export type FallbackStrategy = 'sequential' | 'parallel' | 'circuit_breaker';

export interface AIModel {
  id: string;
  provider: ModelProvider;
  modelName: string;
  displayName: string;
  capabilities: ModelCapability[];
  maxContextTokens: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  averageLatencyMs: number;
  p95LatencyMs: number;
  throughputTokensPerSecond: number;
  costPerInputTokenUSD: number;
  costPerOutputTokenUSD: number;
  costPerRequestUSD?: number;
  isActive: boolean;
  isAvailable: boolean;
  rateLimitPerMinute: number;
  currentLoad: number;
  version: string;
  releasedAt: Date;
  deprecatedAt?: Date;
  metadata: Record<string, any>;
}

export interface RoutingCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'regex';
  value: any;
}

export interface RoutingRule {
  id: string;
  name: string;
  description?: string;
  conditions: RoutingCondition[];
  logic: 'AND' | 'OR';
  primaryModelId: string;
  fallbackModelIds: string[];
  fallbackStrategy: FallbackStrategy;
  maxCostPerRequestUSD?: number;
  maxLatencyMs?: number;
  minConfidenceScore?: number;
  priority: number;
  isActive: boolean;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelRoutingRequest {
  task: {
    type: string;
    description: string;
    complexity?: 'simple' | 'moderate' | 'complex' | 'expert';
    requiredCapabilities?: ModelCapability[];
    estimatedInputTokens?: number;
    estimatedOutputTokens?: number;
  };
  constraints: {
    maxCostUSD?: number;
    maxLatencyMs?: number;
    preferredProvider?: ModelProvider;
    preferredModelId?: string;
  };
  context: {
    tenantId: string;
    workspaceId?: string;
    userId: string;
    correlationId: string;
  };
}

export interface ModelRoutingDecision {
  requestId: string;
  selectedModel: AIModel;
  fallbackModels: AIModel[];
  routingRuleId?: string;
  strategy: RoutingStrategy;
  reasoning: string;
  score: number;
  estimatedCostUSD: number;
  estimatedLatencyMs: number;
  timestamp: Date;
  processingTimeMs: number;
}

export interface ModelFallbackEvent {
  id: string;
  requestId: string;
  originalModelId: string;
  fallbackModelId: string;
  reason: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  success: boolean;
}

export interface ModelCostRecord {
  id: string;
  requestId: string;
  modelId: string;
  tenantId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCostUSD: number;
  outputCostUSD: number;
  totalCostUSD: number;
  latencyMs: number;
  success: boolean;
  timestamp: Date;
}
