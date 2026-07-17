import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type { AuditRetention } from './AuditLogTypes';

export class AuditRetentionManager {
  static async getRetention(tenantId: string): Promise<AuditRetention | null> {
    const { data } = await supabaseAdmin.from('audit_retention').select('*').eq('tenant_id', tenantId).maybeSingle();
    if (!data) return null;
    return {
      tenantId: data.tenant_id,
      retentionDays: data.retention_days,
      archiveAfterDays: data.archive_after_days,
      totalEvents: Number(data.total_events),
      oldestEventDate: data.oldest_event_date ? new Date(data.oldest_event_date) : undefined,
      newestEventDate: data.newest_event_date ? new Date(data.newest_event_date) : undefined,
      storageUsedBytes: Number(data.storage_used_bytes),
      archivedStorageBytes: Number(data.archived_storage_bytes),
      lastCleanupAt: data.last_cleanup_at ? new Date(data.last_cleanup_at) : undefined,
      nextCleanupAt: data.next_cleanup_at ? new Date(data.next_cleanup_at) : undefined,
    };
  }

  static async updateRetention(tenantId: string, opts: { retentionDays?: number; archiveAfterDays?: number }): Promise<void> {
    const payload: Record<string, unknown> = { tenant_id: tenantId };
    if (opts.retentionDays !== undefined) payload.retention_days = opts.retentionDays;
    if (opts.archiveAfterDays !== undefined) payload.archive_after_days = opts.archiveAfterDays;
    await supabaseAdmin.from('audit_retention').upsert(payload as never, { onConflict: 'tenant_id' });
  }

  static async cleanupTenant(tenantId: string): Promise<{ deleted: number }> {
    const retention = await AuditRetentionManager.getRetention(tenantId);
    if (!retention) return { deleted: 0 };
    const cutoff = new Date(Date.now() - retention.retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('audit_logs')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .lt('timestamp', cutoff);
    await supabaseAdmin.from('audit_retention').update({
      last_cleanup_at: new Date().toISOString(),
      next_cleanup_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as never).eq('tenant_id', tenantId);
    return { deleted: count ?? 0 };
  }

  static async cleanupAllTenants(): Promise<void> {
    const { data } = await supabaseAdmin.from('tenants').select('id');
    for (const t of data ?? []) await AuditRetentionManager.cleanupTenant(t.id);
  }
}