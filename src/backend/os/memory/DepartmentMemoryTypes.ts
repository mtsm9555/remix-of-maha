import type { Department } from "../../agents/departments/types";

export type DepartmentMemoryType = "procedural" | "episodic" | "semantic";

export interface DepartmentMemory {
  id: string;
  departmentId: Department;
  type: DepartmentMemoryType;
  content: string;
  embedding: number[];
  importanceScore: number;
  metadata: {
    projectId?: string;
    milestoneId?: string;
    successScore?: number;
    createdAt: Date | string;
    lastAccessedAt: Date | string;
    accessCount: number;
    [k: string]: any;
  };
}

export interface MemorySearchQuery {
  departmentId: Department;
  query: string;
  queryEmbedding: number[];
  types?: DepartmentMemoryType[];
  limit?: number;
  minImportance?: number;
}