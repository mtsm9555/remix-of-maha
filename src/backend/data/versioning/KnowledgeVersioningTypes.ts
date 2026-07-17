export type KnowledgeEntityType =
  | "project_memory"
  | "department_memory"
  | "user_memory"
  | "shared_memory";

export interface KnowledgeVersion {
  id: string;
  entityId: string;
  entityType: KnowledgeEntityType;
  versionNumber: number;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  authorId: string;
  authorType: "human" | "agent" | "system";
  changeSummary: string;
  changeType: "created" | "updated" | "synthesized" | "promoted" | "restored";
  parentVersionId?: string | null;
  isCurrentVersion: boolean;
  createdAt: Date;
}

export interface VersionDiff {
  versionA: KnowledgeVersion;
  versionB: KnowledgeVersion;
  contentDiff: string;
  metadataDiff: {
    added: Record<string, unknown>;
    removed: Record<string, unknown>;
    modified: Record<string, { old: unknown; new: unknown }>;
  };
  embeddingSimilarity: number;
}

export interface RollbackResult {
  success: boolean;
  entityId: string;
  rolledBackToVersion: number;
  newVersionNumber: number;
  reason: string;
}