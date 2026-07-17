export type AccessLevel = "public" | "internal" | "confidential" | "restricted";
export type MemoryOrigin = "project" | "department" | "user" | "manual";
export type PromotionStatus = "draft" | "pending_review" | "approved" | "rejected";

export interface SharedMemoryRecord {
  id: string;
  content: string;
  embedding?: number[];
  accessLevel: AccessLevel;
  category: string;
  origin: MemoryOrigin;
  sourceMemoryId?: string | null;
  sourceDepartment?: string | null;
  authorId: string;
  status: PromotionStatus;
  version: number;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionRequestRecord {
  id: string;
  sourceMemoryId?: string | null;
  sourceDepartment?: string | null;
  proposedContent: string;
  proposedAccessLevel: AccessLevel;
  justification: string;
  status: PromotionStatus;
  requestedBy: string;
  approvedBy?: string | null;
  requestedAt: Date;
  approvedAt?: Date | null;
}

export interface SharedContextChunk {
  id: string;
  source: "shared_memory";
  content: string;
  relevanceScore: number;
  tokenEstimate: number;
  metadata: { accessLevel: AccessLevel; category: string };
}