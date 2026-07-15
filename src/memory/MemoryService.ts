import { EmbeddingProvider } from "./providers/EmbeddingProvider";
import type { Memory } from "./types";

export class MemoryService {
  private embeddings = new EmbeddingProvider();

  async createMemory(userId: string, content: string): Promise<Memory> {
    const embedding = await this.embeddings.embed(content);
    return {
      id: crypto.randomUUID(),
      userId,
      type: "episodic",
      content,
      importance: 0.5,
      embedding,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };
  }
}