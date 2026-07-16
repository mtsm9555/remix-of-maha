export interface ReflectionResult {
  needsRevision: boolean;
  critique: string;
  refinedOutput: unknown;
  confidenceScore: number;
  iterationsUsed: number;
}

export interface ReflectionMetrics {
  agentId: string;
  totalReflections: number;
  selfCorrectionsMade: number;
  qaRejectionsAfterReflection: number;
  averageIterations: number;
  tokenSavingsEstimate: number;
}
