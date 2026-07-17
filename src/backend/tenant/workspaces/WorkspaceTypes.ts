export type WorkspaceType = "project" | "client" | "department" | "research" | "custom";
export type IsolationLevel = "strict" | "moderate" | "open";
export type WorkspaceStatus = "active" | "archived" | "suspended";
export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface WorkspaceIsolationPolicy {
  memoryIsolation: boolean;
  fileIsolation: boolean;
  conversationIsolation: boolean;
  agentIsolation: boolean;
  agentSharing: boolean;
  toolIsolation: boolean;
  allowedTools: string[];
  messageIsolation: boolean;
  allowCrossWorkspaceRead: boolean;
  allowCrossWorkspaceWrite: boolean;
  allowedCrossWorkspaceIds: string[];
}

export interface WorkspaceResourceQuota {
  maxAgents: number;
  maxMemoryRecords: number;
  maxStorageGB: number;
  maxConcurrentTasks: number;
  monthlyBudgetUSD: number;
  allowedModels: string[];
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  type: WorkspaceType;
  isolationLevel: IsolationLevel;
  isolationPolicy: WorkspaceIsolationPolicy;
  ownerId: string;
  memberIds: string[];
  maxMembers: number;
  resourceQuota: WorkspaceResourceQuota;
  status: WorkspaceStatus;
  archivedAt?: Date;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  permissions: string[];
  joinedAt: Date;
  lastActiveAt?: Date;
}

export interface CrossWorkspaceAccess {
  id: string;
  sourceWorkspaceId: string;
  targetWorkspaceId: string;
  accessType: "read" | "write" | "admin";
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface WorkspaceContext {
  workspaceId: string;
  workspaceName: string;
  isolationLevel: IsolationLevel;
  userId: string;
  userRole: WorkspaceRole;
  tenantId: string;
}