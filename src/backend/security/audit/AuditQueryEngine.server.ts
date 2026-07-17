import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type { AuditEvent, AuditLogQuery, AuditLogResult, AuditMetrics, AuditSeverity } from './AuditLogTypes';

function mapToEvent(row: Record<string, any>): AuditEvent {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    workspaceId: row.workspace_id ?? undefined,
    eventType: row.event_type,
    severity: row.severity,
    actorId: row.actor_id,
    actorType: row.actor_type,
    actorEmail: row.actor_email ?? undefined,
    actorName: row.actor_name ?? undefined,
    targetType: row.target_type ?? undefined,
    targetId: row.target_id ?? undefined,
    targetName: row.target_name ?? undefined,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    sessionId: row.session_id ?? undefined,
    correlationId: row.correlation_id ?? undefined,
    details: row.details ?? {},
    success: row.success,
    errorMessage: row.error_message ?? undefined,
    metadata: row.metadata ?? {},
    timestamp: new Date(row.timestamp),
    createdAt: new Date(row.created_at),
  };
}

export class AuditQueryEngine {
  static async queryLogs(query: AuditLogQuery): Promise<AuditLogResult> {
    let q = supabaseAdmin.from('audit_logs').select('*', { count: 'exact' }).eq('tenant_id', query.tenantId);
    if (query.workspaceId) q = q.eq('workspace_id', query.workspaceId);
    if (query.eventTypes?.length) q = q.in('event_type', query.eventTypes);
    if (query.severities?.length) q = q.in('severity', query.severities);
    if (query.actorIds?.length) q = q.in('actor_id', query.actorIds);
    if (query.targetIds?.length) q = q.in('target_id', query.targetIds);
    if (query.ipAddresses?.length) q = q.in('ip_address', query.ipAddresses);
    if (query.startTime) q = q.gte('timestamp', query.startTime.toISOString());
    if (query.endTime) q = q.lte('timestamp', query.endTime.toISOString());
    if (query.searchText) q = q.ilike('target_name', `%${query.searchText}%`);
    const sortBy = query.sortBy ?? 'timestamp';
    q = q.order(sortBy, { ascending: (query.sortOrder ?? 'desc') === 'asc' });
    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;
    q = q.range(offset, offset + limit - 1);
    const { data, count, error } = await q;
    if (error) throw new Error(`Failed to query audit logs: ${error.message}`);
    return { events: (data ?? []).map(mapToEvent), total: count ?? 0, limit, offset };
  }

  static async getEvent(eventId: string, tenantId: string): Promise<AuditEvent | null> {
    const { data } = await supabaseAdmin.from('audit_logs').select('*').eq('id', eventId).eq('tenant_id', tenantId).maybeSingle();
    return data ? mapToEvent(data) : null;
  }

  static async getMetrics(tenantId: string, period: string): Promise<AuditMetrics> {
    const [startDate, endDate] = AuditQueryEngine.parsePeriod(period);
    const { data } = await supabaseAdmin
      .from('audit_logs')
      .select('event_type, severity, success, timestamp')
      .eq('tenant_id', tenantId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());
    const events = data ?? [];
    const eventsByHour = new Array(24).fill(0);
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<AuditSeverity, number> = { info: 0, warning: 0, error: 0, critical: 0 };
    for (const e of events) {
      eventsByHour[new Date(e.timestamp).getHours()]++;
      eventsByType[e.event_type] = (eventsByType[e.event_type] ?? 0) + 1;
      eventsBySeverity[e.severity as AuditSeverity]++;
    }
    const failedLogins = events.filter((e) => e.event_type === 'user.login_failed').length;
    const permissionDenials = events.filter((e) => e.event_type === 'rbac.permission_denied').length;
    const { count: securityAlerts } = await supabaseAdmin
      .from('audit_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    const policyViolations = events.filter((e) => e.event_type === 'security.policy_violation' || e.event_type === 'rbac.permission_denied').length;
    return {
      tenantId, period, totalEvents: events.length, eventsByHour, eventsByType, eventsBySeverity,
      failedLogins, permissionDenials, securityAlerts: securityAlerts ?? 0,
      complianceScore: Math.max(0, 100 - policyViolations * 5), policyViolations,
    };
  }

  static async getResourceTimeline(tenantId: string, targetType: string, targetId: string, limit = 100): Promise<AuditEvent[]> {
    const { data } = await supabaseAdmin
      .from('audit_logs').select('*')
      .eq('tenant_id', tenantId).eq('target_type', targetType).eq('target_id', targetId)
      .order('timestamp', { ascending: false }).limit(limit);
    return (data ?? []).map(mapToEvent);
  }

  static async getUserActivity(tenantId: string, userId: string, days = 30) {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from('audit_logs').select('event_type, timestamp')
      .eq('tenant_id', tenantId).eq('actor_id', userId).gte('timestamp', start);
    const events = data ?? [];
    const actionsByType: Record<string, number> = {};
    const hourCounts = new Array(24).fill(0);
    for (const e of events) {
      actionsByType[e.event_type] = (actionsByType[e.event_type] ?? 0) + 1;
      hourCounts[new Date(e.timestamp).getHours()]++;
    }
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
    const lastEvent = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return {
      totalActions: events.length,
      actionsByType,
      lastActiveAt: lastEvent ? new Date(lastEvent.timestamp) : null,
      mostActiveHour,
    };
  }

  private static parsePeriod(period: string): [Date, Date] {
    const [year, month, day] = period.split('-').map(Number);
    const start = new Date(year, (month ?? 1) - 1, day || 1);
    const end = day ? new Date(year, month - 1, day, 23, 59, 59) : new Date(year, month, 0, 23, 59, 59);
    return [start, end];
  }
}