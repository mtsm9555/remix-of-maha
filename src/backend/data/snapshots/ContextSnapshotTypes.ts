export interface SnapshotChunkMetadata {
  id: string;
  source: string;
  relevanceScore: number;
  tokenEstimate: number;
  contentPreview: string;
}

export interface ContextSnapshot {
  id: string;
  taskId: string;
  agentId: string;
  department: string;
  promptHash: string;
  fullPromptText: string;
  chunkMetadata: SnapshotChunkMetadata[];
  totalTokens: number;
  estimatedCostUSD: number;
  llmModelUsed: string;
  llmTemperature: number;
  createdAt: Date;
}

export interface SnapshotDiffResult {
  snapshotA_id: string;
  snapshotB_id: string;
  addedChunks: SnapshotChunkMetadata[];
  removedChunks: SnapshotChunkMetadata[];
  modifiedChunks: { id: string; oldPreview: string; newPreview: string }[];
  tokenDelta: number;
  promptTextDiff: string;
}

export interface BuiltContextLike {
  assembledPrompt: string;
  totalTokens: number;
  chunks: Array<{
    id: string;
    source: string;
    content: string;
    relevanceScore: number;
    tokenEstimate: number;
  }>;
}