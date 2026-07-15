export interface ContextChunk {
  source: 'conversation' | 'memory' | 'knowledge_graph' | 'tool_result';
  content: string;
  relevanceScore: number; // 0.0 to 1.0
  metadata?: Record<string, any>;
}

export interface BuiltContext {
  userId: string;
  sessionId: string;
  currentQuery: string;
  aggregatedContext: string; // The final compiled string for the LLM
  chunks: ContextChunk[]; // Keep raw chunks for logging/observability
  tokenEstimate: number;
}