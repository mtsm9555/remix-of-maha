export type MemberStatus = "active" | "invited" | "suspended" | "deactivated";
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export type Permission =
  | "org:manage"
  | "org:members:invite"
  | "org:members:remove"
  | "org:roles:manage"
  | "agents:deploy"
  | "agents:execute"
  | "data:read"
  | "data:write"
  | "data:admin"
  | "tools:install"
  | "tools:manage"
  | "analytics:view"
  | "billing:manage"
  | "api:keys:manage";

export interface OrganizationMember {
  id: string;
  tenantId: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  status: MemberStatus;
  teamIds: string[];
  joinedAt: Date;
  lastActiveAt?: Date;
  metadata: Record<string, unknown>;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  departmentId?: string;
  memberCount: number;
  createdAt: Date;
}

export interface MemberInvite {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  teamIds: string[];
  status: InviteStatus;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: Permission[];
  rateLimitPerMinute: number;
  createdBy: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface OrganizationSettings {
  tenantId: string;
  displayName: string;
  logoUrl?: string;
  defaultRole: string;
  requireEmailVerification: boolean;
  allowMemberInvites: boolean;
  sessionTimeoutMinutes: number;
  ipAllowlist?: string[];
  customDomains: string[];
  updatedAt: Date;
}