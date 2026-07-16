import type { ContextChunk } from "./ContextTypes";

export class ContextRanker {
  static rankAndTrim(
    chunks: ContextChunk[],
    maxTokens: number,
  ): { kept: ContextChunk[]; discardedTokens: number } {
    const sorted = [...chunks].sort((a, b) => b.relevanceScore - a.relevanceScore);

    const uniqueChunks: ContextChunk[] = [];
    const seen = new Set<string>();
    for (const chunk of sorted) {
      const norm = chunk.content.replace(/\s+/g, " ").trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        uniqueChunks.push(chunk);
      }
    }

    let currentTokens = 0;
    const kept: ContextChunk[] = [];
    let discardedTokens = 0;
    for (const chunk of uniqueChunks) {
      if (currentTokens + chunk.tokenEstimate <= maxTokens) {
        kept.push(chunk);
        currentTokens += chunk.tokenEstimate;
      } else {
        discardedTokens += chunk.tokenEstimate;
      }
    }
    return { kept, discardedTokens };
  }
}