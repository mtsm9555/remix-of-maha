export type ApiKeyStatus = 'active' | 'revoked' | 'expired' | 'suspended';
export type ApiKeyScope = 'read' | 'write' | 'admin' | 'custom';

export interface AdvancedApiKey {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  keyPrefix: string;
  status: ApiKeyStatus;
  scopes: ApiKeyScope[];
  allowedEndpoints: string[];
  allowedDepartments?: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  ipAllowlist: string[];
  ipBlocklist: string[];
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  lastUsedIp?: string | null;
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date | null;
  revokedBy?: string | null;
  revocationReason?: string | null;
  rotationPolicy?: {
    enabled: boolean;
    intervalDays: number;
    nextRotationAt?: string;
    autoRotate: boolean;
  } | null;
}