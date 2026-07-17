export type CacheLevel = 'L1_MEMORY' | 'L2_REDIS' | 'L3_DATABASE' | 'SEMANTIC';
export type CacheStrategy = 'write_through' | 'write_back' | 'cache_aside' | 'read_through';
export type InvalidationPolicy = 'ttl' | 'lru' | 'lfu' | 'manual' | 'event_driven';
export type CacheEntryType =
  | 'llm_response'
  | 'api_response'
  | 'database_query'
  | 'embedding'
  | 'computation'
  | 'static_asset';

export interface CacheEntry {
  id: string;
  key: string;
  level: CacheLevel;
  type: CacheEntryType;
  value: unknown;
  serializedValue: string;
  sizeBytes: number;
  tenantId: string | null;
  workspaceId?: string | null;
  correlationId?: string | null;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  invalidationTags: string[];
  version: number;
  hitCount: number;
  missCount: number;
  embedding?: number[];
  similarityThreshold?: number;
  originalCostUSD?: number;
  savedCostUSD?: number;
}

export interface CacheRequest {
  key: string;
  type: CacheEntryType;
  tenantId: string;
  workspaceId?: string;
  value?: unknown;
  invalidationTags?: string[];
  ttlSeconds?: number;
  originalCostUSD?: number;
  embedding?: number[];
}

export interface CacheResult {
  hit: boolean;
  value?: unknown;
  level?: CacheLevel;
  entry?: CacheEntry;
  lookupTimeMs: number;
  savedCostUSD?: number;
}