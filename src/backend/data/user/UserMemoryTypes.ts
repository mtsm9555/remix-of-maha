export type UserCategory = "admin" | "employee" | "client" | "prospect";
export type UserMemoryType =
  | "explicit_preference"
  | "implicit_pattern"
  | "biographical_fact"
  | "interaction_summary";

export interface UserMemoryMetadata {
  source: "explicit_input" | "ai_inferred" | "admin_override";
  confidenceScore: number;
  lastVerifiedAt?: Date;
}

export interface UserMemoryRecord {
  id: string;
  userId: string;
  type: UserMemoryType;
  content: string;
  embedding?: number[];
  metadata: UserMemoryMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  name: string | null;
  email: string;
  category: UserCategory;
  timezone: string;
  preferredLanguage: string;
  communicationStyle: "formal" | "casual" | "technical" | "executive_brief";
  activeHoursStart: number;
  activeHoursEnd: number;
}

export interface UserContextQuery {
  userId: string;
  currentTaskDescription: string;
  taskEmbedding: number[];
  limit?: number;
}