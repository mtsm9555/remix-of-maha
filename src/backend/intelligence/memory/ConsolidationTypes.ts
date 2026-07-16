import type { Department } from "../../agents/departments/types";
import type { DepartmentMemoryType } from "../../os/memory/DepartmentMemoryTypes";

export interface RawMemory {
  id: string;
  department: Department;
  source: "task_output" | "chat_transcript" | "tool_execution" | "incident_log";
  content: string;
  timestamp: Date;
  isConsolidated: boolean;
}

export interface ExtractedMemory {
  type: DepartmentMemoryType;
  content: string;
  entities: string[];
  relationships: { source: string; relation: string; target: string }[];
  importanceScore: number;
}

export interface ConsolidationJob {
  id: string;
  department: Department;
  rawMemoryIds: string[];
  status: "pending" | "processing" | "completed" | "failed";
  memoriesExtracted: number;
  graphNodesUpdated: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
