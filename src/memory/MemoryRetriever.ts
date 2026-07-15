import { MemoryRanker } from "./MemoryRanker";
import type { Memory, RetrievedMemory } from "./types";

export class MemoryRetriever {
  private ranker = new MemoryRanker();
  private store: Memory[] = [];

  register(memory: Memory) {
    this.store.push(memory);
  }

  async search(userId: string, _query: string): Promise<RetrievedMemory[]> {
    const scoped = this.store.filter((m) => m.userId === userId);
    return this.ranker.rank(scoped);
  }
}