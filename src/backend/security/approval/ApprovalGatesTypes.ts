export type ApprovalAction =
  | 'agent.create'
  | 'agent.deploy'
  | 'agent.delete'
  | 'tool.install'
  | 'tool.execute_destructive'
  | 'secret.access'
  | 'secret.rotate'
  | 'data.export'
  | 'data.delete'
  | 'billing.change'
  | 'policy.update'
  | 'production.deploy'
  | 'custom';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type ApprovalPriority = 'low' | 'normal' | 'high' | 'critical';
export type ApprovalType = 'single' | 'multi' | 'hierarchical' | 'quorum';

export interface ApprovalCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'neq' | 'in' | 'contains';
  value: any;
}

export interface ApprovalPolicy {
  id: string;
  tenantId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  action: ApprovalAction;
  conditions: ApprovalCondition[];
  approvalType: ApprovalType;
  requiredApprovers: number;
  approverRoles: string[];
  approverUsers: string[];
  approverHierarchy?: string[];
  timeoutMinutes: number;
  autoRejectOnTimeout: boolean;
  notifyApprovers: boolean;
  notifyRequester: boolean;
  notificationChannels: ('email' | 'slack' | 'in_app')[];
  isActive: boolean;
  priority: ApprovalPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalDecision {
  id: string;
  requestId: string;
  approverId: string;
  decision: 'approved' | 'rejected';
  comments?: string;
  decidedAt: Date;
  metadata: Record<string, any>;
}

export interface ApprovalAssignment {
  id: string;
  requestId: string;
  approverId: string;
  approverRole?: string;
  assignedAt: Date;
  respondedAt?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  decision?: ApprovalDecision;
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  workspaceId?: string;
  policyId: string;
  action: ApprovalAction;
  priority: ApprovalPriority;
  requestedBy: string;
  requestedAt: Date;
  targetResourceType?: string;
  targetResourceId?: string;
  targetResourceName?: string;
  requestData: Record<string, any>;
  justification: string;
  status: ApprovalStatus;
  assignedApprovers: ApprovalAssignment[];
  currentApproverIndex: number;
  decisions: ApprovalDecision[];
  expiresAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  executedAt?: Date;
  executedBy?: string;
  executionResult?: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalNotification {
  id: string;
  requestId: string;
  recipientId: string;
  type: 'approval_requested' | 'approval_received' | 'approval_expired' | 'approval_cancelled';
  channel: 'email' | 'slack' | 'in_app';
  sentAt: Date;
  readAt?: Date;
  content: {
    title: string;
    message: string;
    actionUrl?: string;
  };
}

export interface ApprovalExecution {
  id: string;
  requestId: string;
  action: ApprovalAction;
  payload: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  executedAt?: Date;
  executedBy?: string;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
}