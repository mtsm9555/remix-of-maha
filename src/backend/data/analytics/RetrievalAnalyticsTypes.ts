export type MemorySource = "project" | "department" | "user" | "shared";

export interface RetrievalEvent {
  id: string;
  timestamp: Date;
  source: MemorySource;
  queryText: string;
  queryEmbeddingDimension: number;
  latencyMs: number;
  resultsReturned: number;
  tokensConsumed: number;
  estimatedCostUSD: number;
  avgRelevanceScore: number;
  memoryIdsFetched: string[];
}

export type MemoryHealthStatus = "high_value" | "active" | "stale" | "dead";

export interface MemoryHealthScore {
  memoryId: string;
  source: MemorySource;
  totalRetrievals: number;
  avgRelevanceScore: number;
  lastRetrievedAt: Date;
  healthStatus: MemoryHealthStatus;
}