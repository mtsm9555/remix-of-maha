// src/memory/memoryTypes.ts

export type MemoryItem = {
  id: string;
  ownerId: string; // agentId or systemId
  type: "fact" | "task" | "decision" | "note";
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
