import type { Memory, RetrievedMemory } from "./types";

export class MemoryRanker {
  rank(memories: Memory[]): RetrievedMemory[] {
    return memories
      .map((memory) => ({
        memory,
        score: memory.importance * 0.6 + this.recency(memory) * 0.4,
      }))
      .sort((a, b) => b.score - a.score);
  }

  private recency(memory: Memory) {
    const age = Date.now() - memory.createdAt.getTime();
    const days = age / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - days / 30);
  }
}