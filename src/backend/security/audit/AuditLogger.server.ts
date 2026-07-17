import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type { AuditEvent, AuditEventType, AuditSeverity } from './AuditLogTypes';

interface Actor {
  id: string;
  type: 'user' | 'agent' | 'system' | 'api_key';
  email?: string;
  name?: string;
}

interface LogDetails {
  workspaceId?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  correlationId?: string;
  details?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

function toRow(event: AuditEvent) {
  return {
    id: event.id,
    tenant_id: event.tenantId,
    workspace_id: event.workspaceId,
    event_type: event.eventType,
    severity: event.severity,
    actor_id: event.actorId,
    actor_type: event.actorType,
    actor_email: event.actorEmail,
    actor_name: event.actorName,
    target_type: event.targetType,
    target_id: event.targetId,
    target_name: event.targetName,
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
    session_id: event.sessionId,
    correlation_id: event.correlationId,
    details: event.details,
    success: event.success,
    error_message: event.errorMessage,
    metadata: event.metadata,
    timestamp: event.timestamp.toISOString(),
    created_at: event.createdAt.toISOString(),
  };
}

export class AuditLogger {
  static async log(
    eventType: AuditEventType,
    severity: AuditSeverity,
    actor: Actor,
    tenantId: string,
    details: LogDetails,
  ): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: `audit_${crypto.randomUUID()}`,
      tenantId,
      workspaceId: details.workspaceId,
      eventType,
      severity,
      actorId: actor.id,
      actorType: actor.type,
      actorEmail: actor.email,
      actorName: actor.name,
      targetType: details.targetType,
      targetId: details.targetId,
      targetName: details.targetName,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      sessionId: details.sessionId,
      correlationId: details.correlationId,
      details: details.details ?? {},
      success: details.success,
      errorMessage: details.errorMessage,
      metadata: details.metadata ?? {},
      timestamp: new Date(),
      createdAt: new Date(),
    };

    const { error } = await supabaseAdmin.from('audit_logs').insert(toRow(event));
    if (error) console.error('[AuditLogger] insert failed:', error);

    await AuditLogger.checkForAlerts(event);
    return event;
  }

  static async logSuccess(eventType: AuditEventType, actor: Actor, tenantId: string, details: Omit<LogDetails, 'success'>): Promise<AuditEvent> {
    return AuditLogger.log(eventType, 'info', actor, tenantId, { ...details, success: true });
  }

  static async logFailure(eventType: AuditEventType, severity: AuditSeverity, actor: Actor, tenantId: string, details: Omit<LogDetails, 'success' | 'errorMessage'>, errorMessage: string): Promise<AuditEvent> {
    return AuditLogger.log(eventType, severity, actor, tenantId, { ...details, success: false, errorMessage });
  }

  private static async checkForAlerts(event: AuditEvent): Promise<void> {
    if (event.eventType === 'user.login_failed') await AuditLogger.checkBruteForce(event);
    if (event.eventType === 'rbac.permission_denied') await AuditLogger.checkPermissionDenials(event);
    if (event.eventType === 'vault.secret_accessed') await AuditLogger.checkVaultAccessAnomaly(event);
  }

  private static async checkBruteForce(event: AuditEvent): Promise<void> {
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', event.tenantId)
      .eq('event_type', 'user.login_failed')
      .eq('ip_address', event.ipAddress)
      .gte('timestamp', since);
    if (count && count >= 5) {
      await AuditLogger.createAlert(event.tenantId, 'security_threat', 'critical',
        'Brute Force Attack Detected', `${count} failed logins from ${event.ipAddress}`, [event.id]);
    }
  }

  private static async checkPermissionDenials(event: AuditEvent): Promise<void> {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', event.tenantId)
      .eq('event_type', 'rbac.permission_denied')
      .eq('actor_id', event.actorId)
      .gte('timestamp', since);
    if (count && count >= 10) {
      await AuditLogger.createAlert(event.tenantId, 'policy_violation', 'warning',
        'Excessive Permission Denials', `${event.actorEmail ?? event.actorId} denied ${count} times`, [event.id]);
    }
  }

  private static async checkVaultAccessAnomaly(event: AuditEvent): Promise<void> {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', event.tenantId)
      .eq('event_type', 'vault.secret_accessed')
      .eq('actor_id', event.actorId)
      .gte('timestamp', since);
    if (count && count >= 20) {
      await AuditLogger.createAlert(event.tenantId, 'anomaly', 'warning',
        'Unusual Vault Access Pattern', `${event.actorEmail ?? event.actorId} accessed ${count} secrets`, [event.id]);
    }
  }

  private static async createAlert(tenantId: string, alertType: string, severity: AuditSeverity, title: string, description: string, relatedEventIds: string[]): Promise<void> {
    await supabaseAdmin.from('audit_alerts').insert({
      id: `alert_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      alert_type: alertType,
      severity,
      title,
      description,
      related_event_ids: relatedEventIds,
      event_count: relatedEventIds.length,
      status: 'active',
      metadata: {},
    });
  }
}