// src/memory/memoryManager.ts

import { MemoryStore } from "./memoryStore";

export class MemoryManager {
  constructor(private memoryStore: MemoryStore) {}

  rememberDecision(ownerId: string, decision: string): string {
    this.memoryStore.addMemory(
      `decision-${Date.now()}`,
      ownerId,
      "decision",
      decision,
      ["decision", "important"]
    );

    return `Decision saved for ${ownerId}`;
  }

  rememberNote(ownerId: string, note: string): string {
    this.memoryStore.addMemory(
      `note-${Date.now()}`,
      ownerId,
      "note",
      note,
      ["note"]
    );

    return `Note saved for ${ownerId}`;
  }

  searchOwnerMemory(ownerId: string): string[] {
    return this.memoryStore.getMemoriesByOwner(ownerId).map((m) => m.content);
  }
}
