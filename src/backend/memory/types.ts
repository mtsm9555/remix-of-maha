export interface RawMemoryLog {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  timestamp: Date;
  isConsolidated: boolean;
}

export interface ConsolidatedMemory {
  id: string;
  userId: string;
  summary: string;
  entities: string[];
  relationships: { source: string; relation: string; target: string }[];
  importanceScore: number;
  createdAt: Date;
}

export interface ConsolidationJob {
  jobId: string;
  userId: string;
  sessionId: string;
  rawLogs: RawMemoryLog[];
}