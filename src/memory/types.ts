export interface Memory {
  id: string;
  userId: string;
  type: "episodic" | "semantic" | "procedural";
  content: string;
  importance: number;
  embedding: number[];
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