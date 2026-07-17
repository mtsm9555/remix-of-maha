export type SecretType = 'api_key' | 'database_credential' | 'encryption_key' | 'certificate' | 'oauth_token' | 'custom';
export type EncryptionAlgorithm = 'AES-256-GCM';
export type RotationStatus = 'active' | 'rotating' | 'expired' | 'revoked';

export interface SecretAccessPolicy {
  allowedRoles: string[];
  allowedUsers: string[];
  allowedWorkspaces: string[];
  requireApproval: boolean;
  approvers: string[];
  maxAccessDuration?: number;
  ipAllowlist?: string[];
}

export interface Secret {
  id: string;
  tenantId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  type: SecretType;
  tags: string[];
  encryptedValue: string;
  encryptionKeyId: string;
  encryptionAlgorithm: EncryptionAlgorithm;
  version: number;
  rotationEnabled: boolean;
  rotationIntervalDays?: number;
  lastRotatedAt?: string;
  nextRotationAt?: string;
  rotationStatus: RotationStatus;
  accessPolicy: SecretAccessPolicy;
  expiresAt?: string;
  isRevoked: boolean;
  accessCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DecryptedSecret extends Omit<Secret, 'encryptedValue'> {
  value: string;
}

export interface SecretAuditLog {
  id: string;
  tenantId: string;
  secretId?: string;
  userId?: string;
  action: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  timestamp: string;
}