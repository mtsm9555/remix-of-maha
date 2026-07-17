export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'admin';
export type ResourceType = 'agent' | 'memory' | 'tool' | 'workspace' | 'team' | 'user' | 'api_key' | 'billing' | 'settings' | 'analytics';
export type RoleType = 'system' | 'tenant' | 'workspace' | 'custom';

export interface Permission {
  id: string;
  resource: ResourceType;
  action: PermissionAction;
  description: string;
  isSystem: boolean;
  createdAt: Date;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: RoleType;
  parentRoleId?: string;
  inheritsPermissions: boolean;
  permissions: string[];
  effectivePermissions: string[];
  maxMembers?: number;
  currentMemberCount: number;
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  workspaceId?: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

export interface PermissionCheck {
  userId: string;
  tenantId: string;
  workspaceId?: string;
  resource: ResourceType;
  action: PermissionAction;
  resourceId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  roleId?: string;
  permissionId?: string;
  evaluationTimeMs: number;
}