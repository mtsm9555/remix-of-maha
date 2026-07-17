export type ProjectMemoryType =
  | "brief"
  | "meeting_notes"
  | "asset"
  | "feedback"
  | "decision"
  | "code_snippet";

export interface ProjectMemoryRecord {
  id: string;
  projectId: string;
  type: ProjectMemoryType;
  content: string;
  embedding?: number[] | null;
  metadata: {
    authorAgentId?: string;
    sourceDocumentId?: string;
    tags?: string[];
    confidentiality?: "internal" | "confidential" | "public";
    [k: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectContext {
  projectId: string;
  projectName: string;
  clientName: string;
  activePhase: "initiation" | "execution" | "review" | "archived";
  summary: string | null;
}

export interface ProjectMemorySearchQuery {
  projectId: string;
  queryText: string;
  queryEmbedding: number[];
  types?: ProjectMemoryType[];
  limit?: number;
  minConfidence?: number;
}