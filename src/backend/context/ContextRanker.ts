import { ContextChunk } from "./types";

export class ContextRanker {
  /**
   * Ranks, deduplicates, and truncates context chunks to fit a token limit.
   */
  static rankAndTrim(chunks: ContextChunk[], maxTokens: number = 2000): ContextChunk[] {
    const sorted = [...chunks].sort((a, b) => b.relevanceScore - a.relevanceScore);

    const uniqueChunks: ContextChunk[] = [];
    const seen = new Set<string>();
    for (const chunk of sorted) {
      if (!seen.has(chunk.content)) {
        seen.add(chunk.content);
        uniqueChunks.push(chunk);
      }
    }

    let currentTokens = 0;
    const finalChunks: ContextChunk[] = [];
    for (const chunk of uniqueChunks) {
      const chunkTokens = Math.ceil(chunk.content.length / 4);
      if (currentTokens + chunkTokens <= maxTokens) {
        finalChunks.push(chunk);
        currentTokens += chunkTokens;
      } else {
        break;
      }
    }

    return finalChunks;
  }
}