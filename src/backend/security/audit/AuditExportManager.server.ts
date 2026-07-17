import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { AuditQueryEngine } from './AuditQueryEngine.server';
import type { AuditEvent, AuditLogExport, AuditLogQuery } from './AuditLogTypes';

function mapExport(row: Record<string, any>): AuditLogExport {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    format: row.format,
    query: row.query as AuditLogQuery,
    status: row.status,
    progress: row.progress,
    fileUrl: row.file_url ?? undefined,
    fileSizeBytes: row.file_size_bytes ?? undefined,
    eventCount: row.event_count ?? undefined,
    expiresAt: new Date(row.expires_at),
    downloadedAt: row.downloaded_at ? new Date(row.downloaded_at) : undefined,
    downloadedBy: row.downloaded_by ?? undefined,
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

function generateCSV(events: AuditEvent[]): string {
  const headers = ['timestamp', 'event_type', 'severity', 'actor_id', 'actor_email', 'target_type', 'target_id', 'ip_address', 'success', 'error_message'];
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = events.map((e) => [
    e.timestamp.toISOString(), e.eventType, e.severity, e.actorId, e.actorEmail ?? '',
    e.targetType ?? '', e.targetId ?? '', e.ipAddress, e.success, e.errorMessage ?? '',
  ].map(escape).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export class AuditExportManager {
  static async createExport(tenantId: string, query: AuditLogQuery, format: 'csv' | 'json' | 'pdf', _requestedBy: string): Promise<AuditLogExport> {
    const id = `export_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await supabaseAdmin.from('audit_exports').insert({
      id, tenant_id: tenantId, format, query: query as never, status: 'pending', progress: 0,
      expires_at: expiresAt.toISOString(),
    } as never);
    // Process synchronously (Worker has no long-lived background)
    await AuditExportManager.processExport(id).catch((e) => console.error('[AuditExport] failed', e));
    return (await AuditExportManager.getExportStatus(id, tenantId))!;
  }

  private static async processExport(exportId: string): Promise<void> {
    const { data: exp } = await supabaseAdmin.from('audit_exports').select('*').eq('id', exportId).maybeSingle();
    if (!exp) return;
    try {
      await supabaseAdmin.from('audit_exports').update({ status: 'processing', progress: 25 } as never).eq('id', exportId);
      const result = await AuditQueryEngine.queryLogs({ ...(exp.query as unknown as AuditLogQuery), tenantId: exp.tenant_id, limit: 100000 });
      let content: string;
      if (exp.format === 'csv') content = generateCSV(result.events);
      else if (exp.format === 'json') content = JSON.stringify(result.events, null, 2);
      else content = `Audit Log Export\nTotal Events: ${result.events.length}`;
      await supabaseAdmin.from('audit_exports').update({
        status: 'completed', progress: 100,
        file_content: content, file_size_bytes: content.length, event_count: result.total,
        completed_at: new Date().toISOString(),
      } as never).eq('id', exportId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabaseAdmin.from('audit_exports').update({ status: 'failed', error_message: msg } as never).eq('id', exportId);
    }
  }

  static async getExportStatus(exportId: string, tenantId: string): Promise<AuditLogExport | null> {
    const { data } = await supabaseAdmin.from('audit_exports').select('*').eq('id', exportId).eq('tenant_id', tenantId).maybeSingle();
    return data ? mapExport(data) : null;
  }

  static async getExports(tenantId: string, limit = 50): Promise<AuditLogExport[]> {
    const { data } = await supabaseAdmin.from('audit_exports').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit);
    return (data ?? []).map(mapExport);
  }

  static async downloadExport(exportId: string, tenantId: string, downloadedBy: string): Promise<{ content: string; format: string }> {
    const { data } = await supabaseAdmin.from('audit_exports').select('*').eq('id', exportId).eq('tenant_id', tenantId).eq('status', 'completed').maybeSingle();
    if (!data) throw new Error('Export not found or not completed');
    if (new Date(data.expires_at) < new Date()) throw new Error('Export has expired');
    await supabaseAdmin.from('audit_exports').update({
      downloaded_at: new Date().toISOString(), downloaded_by: downloadedBy,
    } as never).eq('id', exportId);
    return { content: (data.file_content as string) ?? '', format: data.format };
  }

  static async cleanupExpiredExports(): Promise<number> {
    const { data } = await supabaseAdmin.from('audit_exports').select('id').lt('expires_at', new Date().toISOString());
    if (!data?.length) return 0;
    await supabaseAdmin.from('audit_exports').delete().in('id', data.map((e) => e.id));
    return data.length;
  }
}