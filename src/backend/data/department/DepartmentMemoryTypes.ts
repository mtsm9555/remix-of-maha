import type { Department } from "../../agents/departments/types";

export type DepartmentMemoryType =
  | "procedural"
  | "episodic"
  | "semantic"
  | "project_lesson"
  | "kpi_insight";

export type SynthesisState = "raw" | "synthesized" | "deprecated" | "archived";

export interface KpiImpact {
  kpiName: string;
  impactScore: number;
}

export interface DepartmentMemoryRecord {
  id: string;
  departmentId: Department;
  type: DepartmentMemoryType;
  content: string;
  embedding?: number[];
  sourceProjectId?: string;
  synthesisState: SynthesisState;
  kpiImpact?: KpiImpact;
  metadata: {
    authorAgentId?: string;
    tags: string[];
    confidentiality: "internal" | "confidential";
  };
  importanceScore: number;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
}