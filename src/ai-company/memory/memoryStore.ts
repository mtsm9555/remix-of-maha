// src/memory/memoryStore.ts

import { MemoryItem } from "./memoryTypes";

export class MemoryStore {
  private memories: Map<string, MemoryItem> = new Map();

  addMemory(
    id: string,
    ownerId: string,
    type: MemoryItem["type"],
    content: string,
    tags: string[] = []
  ): MemoryItem {
    const now = new Date().toISOString();

    const item: MemoryItem = {
      id,
      ownerId,
      type,
      content,
      tags,
      createdAt: now,
      updatedAt: now,
    };

    this.memories.set(id, item);
    return item;
  }

  getMemory(id: string): MemoryItem | undefined {
    return this.memories.get(id);
  }

  getAllMemories(): MemoryItem[] {
    return Array.from(this.memories.values());
  }

  getMemoriesByOwner(ownerId: string): MemoryItem[] {
    return this.getAllMemories().filter((m) => m.ownerId === ownerId);
  }

  getMemoriesByTag(tag: string): MemoryItem[] {
    return this.getAllMemories().filter((m) => m.tags.includes(tag));
  }

  updateMemory(
    id: string,
    patch: Partial<Pick<MemoryItem, "content" | "tags">>
  ): MemoryItem {
    const item = this.memories.get(id);

    if (!item) {
      throw new Error(`Memory not found: ${id}`);
    }

    const updated: MemoryItem = {
      ...item,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.memories.set(id, updated);
    return updated;
  }

  deleteMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  clearAll(): number {
    const count = this.memories.size;
    this.memories.clear();
    return count;
  }
}
