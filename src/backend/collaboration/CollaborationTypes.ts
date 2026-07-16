import type { Department } from "../agents/departments/types";

export type MessageIntent =
  | "REQUEST_PROPOSAL"
  | "PROPOSAL"
  | "ACCEPT_PROPOSAL"
  | "REJECT_PROPOSAL"
  | "INFORM_RESULT"
  | "QUERY_STATE"
  | "FAILURE";

export interface AgentMessage {
  id: string;
  senderId: string;
  senderDepartment: Department;
  receiverId?: string;
  receiverDepartment?: Department;
  intent: MessageIntent;
  payload: Record<string, unknown>;
  collaborationId?: string;
  timestamp: Date;
}

export interface CollaborationSession {
  id: string;
  initiatorId: string;
  participants: string[];
  objective: string;
  status: "negotiating" | "active" | "completed" | "failed";
  blackboardId: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface BlackboardArtifact {
  id: string;
  collaborationId: string;
  ownerAgentId: string;
  content: Record<string, unknown>;
  version: number;
  lockedBy?: string;
  updatedAt: Date;
}