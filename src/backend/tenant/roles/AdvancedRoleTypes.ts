export type Permission = string;

export interface PermissionCondition {
  type: 'resource_owner' | 'time_based' | 'ip_based' | 'department_based' | 'custom';
  config: Record<string, any>;
}

export interface ConditionalPermission {
  id: string;
  roleId: string;
  permission: Permission;
  condition: PermissionCondition;
  description: string;
  isActive: boolean;
}

export interface AdvancedRole {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  parentRoleId?: string | null;
  inheritanceDepth: number;
  directPermissions: Permission[];
  inheritedPermissions: Permission[];
  effectivePermissions: Permission[];
  conditionalPermissions: ConditionalPermission[];
  isSystemRole: boolean;
  isTemplate: boolean;
  maxMembers: number;
  currentMemberCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  permissions: Permission[];
  conditionalPermissions: ConditionalPermission[];
  isSystemTemplate: boolean;
}

export interface RoleChangeLog {
  id: string;
  roleId: string;
  changeType: 'created' | 'updated' | 'deleted' | 'permission_added' | 'permission_removed' | 'member_added' | 'member_removed';
  changedBy: string | null;
  changedAt: Date;
  details: Record<string, any>;
}

export interface RoleAssignment {
  id: string;
  roleId: string;
  userId: string;
  tenantId: string;
  assignedBy: string | null;
  assignedAt: Date;
  expiresAt?: Date | null;
  isActive: boolean;
  isTemporary: boolean;
}

export interface JITRoleElevation {
  id: string;
  userId: string;
  tenantId: string;
  targetRoleId: string;
  reason: string;
  requestedAt: Date;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface PermissionEvaluationContext {
  userId: string;
  tenantId: string;
  permission: Permission;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}