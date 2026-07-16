export type ContextSourceType =
  | "os_state"
  | "department"
  | "memory"
  | "knowledge_graph"
  | "conversation"
  | "tool_result"
  | "user_profile";

export interface ContextChunk {
  id: string;
  source: ContextSourceType;
  content: string;
  relevanceScore: number;
  tokenEstimate: number;
  metadata?: Record<string, any>;
}

export interface ContextRequest {
  userId: string;
  sessionId: string;
  currentTask: string;
  actorDepartment?: string;
  actorAgentId?: string;
  activePlanId?: string;
  maxTokens: number;
}

export interface BuiltContext {
  assembledPrompt: string;
  chunks: ContextChunk[];
  totalTokens: number;
  discardedTokens: number;
}