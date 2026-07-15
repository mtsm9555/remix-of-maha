export type MemoryType =
  | "episodic"
  | "semantic"
  | "fact"
  | "task"
  | "preference";

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  importance: number;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt: Date;
  lastAccessed: Date;
}

export interface RetrievedMemory {
  memory: Memory;
  score: number;
}

export interface Entity {
  name: string;
  type: string;
}