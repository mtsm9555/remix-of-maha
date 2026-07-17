export type AuditEventType =
  | 'user.login' | 'user.logout' | 'user.login_failed' | 'user.password_changed'
  | 'user.mfa_enabled' | 'user.mfa_disabled' | 'user.session_created' | 'user.session_revoked'
  | 'rbac.role_created' | 'rbac.role_updated' | 'rbac.role_deleted' | 'rbac.role_assigned'
  | 'rbac.role_revoked' | 'rbac.permission_checked' | 'rbac.permission_denied'
  | 'vault.secret_created' | 'vault.secret_accessed' | 'vault.secret_updated'
  | 'vault.secret_rotated' | 'vault.secret_revoked' | 'vault.secret_deleted'
  | 'vault.access_requested' | 'vault.access_approved' | 'vault.access_rejected'
  | 'data.memory_created' | 'data.memory_accessed' | 'data.memory_updated' | 'data.memory_deleted'
  | 'data.file_uploaded' | 'data.file_downloaded' | 'data.file_deleted' | 'data.export_requested'
  | 'agent.created' | 'agent.deployed' | 'agent.executed' | 'agent.failed' | 'agent.stopped' | 'agent.deleted'
  | 'tool.installed' | 'tool.executed' | 'tool.failed' | 'tool.uninstalled'
  | 'api.key_created' | 'api.key_used' | 'api.key_revoked' | 'api.rate_limited' | 'api.endpoint_called'
  | 'billing.subscription_created' | 'billing.subscription_updated' | 'billing.subscription_cancelled'
  | 'billing.payment_succeeded' | 'billing.payment_failed' | 'billing.invoice_generated'
  | 'system.config_changed' | 'system.backup_created' | 'system.backup_restored'
  | 'system.failover_initiated' | 'system.failover_completed'
  | 'security.anomaly_detected' | 'security.threat_blocked' | 'security.policy_violation'
  | 'security.ip_blocked' | 'security.brute_force_detected';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  id: string;
  tenantId: string;
  workspaceId?: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  actorId: string;
  actorType: 'user' | 'agent' | 'system' | 'api_key';
  actorEmail?: string;
  actorName?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  correlationId?: string;
  details: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
}

export interface AuditLogQuery {
  tenantId: string;
  workspaceId?: string;
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  actorIds?: string[];
  targetIds?: string[];
  ipAddresses?: string[];
  startTime?: Date;
  endTime?: Date;
  searchText?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'event_type';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogResult {
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogExport {
  id: string;
  tenantId: string;
  format: 'csv' | 'json' | 'pdf';
  query: AuditLogQuery;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileUrl?: string;
  fileSizeBytes?: number;
  eventCount?: number;
  expiresAt: Date;
  downloadedAt?: Date;
  downloadedBy?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface AuditMetrics {
  tenantId: string;
  period: string;
  totalEvents: number;
  eventsByHour: number[];
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  failedLogins: number;
  permissionDenials: number;
  securityAlerts: number;
  complianceScore: number;
  policyViolations: number;
}

export interface AuditRetention {
  tenantId: string;
  retentionDays: number;
  archiveAfterDays: number;
  totalEvents: number;
  oldestEventDate?: Date;
  newestEventDate?: Date;
  storageUsedBytes: number;
  archivedStorageBytes: number;
  lastCleanupAt?: Date;
  nextCleanupAt?: Date;
}