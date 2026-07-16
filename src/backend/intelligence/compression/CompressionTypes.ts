export type CompressionStrategy =
  | "summarize"
  | "extract_decisions"
  | "extract_entities"
  | "conversation_distill"
  | "code_compress";

export interface CompressionConfig {
  maxTargetTokens: number;
  preferredStrategy: CompressionStrategy;
  preserveExactQuotes: boolean;
}

export interface CompressedContext {
  originalTokenCount: number;
  compressedTokenCount: number;
  compressionRatio: number;
  content: string;
  metadata: {
    strategyUsed: CompressionStrategy;
    chunksProcessed: number;
    chunksDropped: number;
  };
}
