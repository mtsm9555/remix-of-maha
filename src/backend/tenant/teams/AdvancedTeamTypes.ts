export interface TeamSettings {
  allowMemberInvites: boolean;
  requireApprovalForJoin: boolean;
  defaultAgentModel: string;
  maxConcurrentTasks: number;
  notificationPreferences: { email: boolean; slack: boolean; inApp: boolean };
}

export interface TeamResourceQuota {
  maxAgents: number;
  monthlyBudgetUSD: number;
  maxMemoryRecords: number;
  maxStorageGB: number;
  allowedTools: string[];
}

export interface TeamHierarchy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  parentTeamId?: string;
  level: number;
  path: string;
  departmentId?: string;
  memberCount: number;
  childTeamCount: number;
  settings: TeamSettings;
  resourceQuota: TeamResourceQuota;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamChannel {
  id: string;
  teamId: string;
  name: string;
  type: "general" | "project" | "announcement" | "private";
  description: string;
  memberIds: string[];
  messageCount: number;
  lastMessageAt?: Date;
  createdAt: Date;
}

export interface TeamMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachments: string[];
  mentions: string[];
  replyToId?: string;
  reactions: Record<string, string[]>;
  createdAt: Date;
  editedAt?: Date;
}

export interface TeamPerformanceMetrics {
  teamId: string;
  period: string;
  totalTasksCompleted: number;
  averageTaskDuration: number;
  budgetUtilization: number;
  agentSuccessRate: number;
  memberContribution: Array<{ memberId: string; tasksCompleted: number; hoursLogged: number }>;
}

export interface CrossTeamCollaboration {
  id: string;
  sourceTeamId: string;
  targetTeamId: string;
  type: "shared_project" | "resource_sharing" | "workflow_handoff";
  status: "active" | "completed" | "cancelled";
  metadata: Record<string, unknown>;
  createdAt: Date;
}