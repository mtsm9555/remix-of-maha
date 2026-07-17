import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { EncryptionAuditLog } from "./DataEncryptionTypes";
import * as crypto from "crypto";

export class EncryptionAuditLogger {
  static async log(log: Omit<EncryptionAuditLog, 'id' | 'timestamp'>): Promise<void> {
    const fullLog: EncryptionAuditLog = {
      ...log,
      id: `audit_${crypto.randomUUID()}`,
      timestamp: new Date(),
    };
    await supabaseAdmin.from('encryption_audit_logs').insert({
      id: fullLog.id,
      tenant_id: fullLog.tenantId,
      action: fullLog.action,
      actor_id: fullLog.actorId,
      actor_type: fullLog.actorType,
      key_id: fullLog.keyId,
      table_name: fullLog.tableName,
      field_name: fullLog.fieldName,
      record_count: fullLog.recordCount,
      success: fullLog.success,
      error_message: fullLog.errorMessage,
      ip_address: fullLog.ipAddress,
      user_agent: fullLog.userAgent,
      timestamp: fullLog.timestamp.toISOString(),
    });
  }

  static async getAuditLogs(
    tenantId: string,
    options: { action?: string; tableName?: string; fieldName?: string; limit?: number } = {}
  ): Promise<EncryptionAuditLog[]> {
    let query = supabaseAdmin
      .from('encryption_audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('timestamp', { ascending: false })
      .limit(options.limit || 100);
    if (options.action) query = query.eq('action', options.action);
    if (options.tableName) query = query.eq('table_name', options.tableName);
    if (options.fieldName) query = query.eq('field_name', options.fieldName);
    const { data } = await query;
    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      action: row.action,
      actorId: row.actor_id,
      actorType: row.actor_type,
      keyId: row.key_id,
      tableName: row.table_name,
      fieldName: row.field_name,
      recordCount: row.record_count,
      success: row.success,
      errorMessage: row.error_message,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: new Date(row.timestamp),
    }));
  }

  static async getMetrics(tenantId: string, days: number = 30): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { data: logs } = await supabaseAdmin
      .from('encryption_audit_logs')
      .select('action, table_name, field_name, timestamp')
      .eq('tenant_id', tenantId)
      .gte('timestamp', startDate.toISOString());

    const totalEncryptions = logs?.filter((l: any) => l.action === 'encrypt').length || 0;
    const totalDecryptions = logs?.filter((l: any) => l.action === 'decrypt').length || 0;

    const byTable: Record<string, { encryptions: number; decryptions: number }> = {};
    const byField: Record<string, { encryptions: number; decryptions: number }> = {};
    for (const log of logs || []) {
      if (log.table_name) {
        byTable[log.table_name] ||= { encryptions: 0, decryptions: 0 };
        if (log.action === 'encrypt') byTable[log.table_name].encryptions++;
        else if (log.action === 'decrypt') byTable[log.table_name].decryptions++;
      }
      if (log.table_name && log.field_name) {
        const k = `${log.table_name}.${log.field_name}`;
        byField[k] ||= { encryptions: 0, decryptions: 0 };
        if (log.action === 'encrypt') byField[k].encryptions++;
        else if (log.action === 'decrypt') byField[k].decryptions++;
      }
    }

    const { count: activeKeys } = await supabaseAdmin
      .from('encryption_keys')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('is_revoked', false);

    const { count: rotatedKeys } = await supabaseAdmin
      .from('key_rotation_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('rotated_at', startDate.toISOString());

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const { count: expiringKeys } = await supabaseAdmin
      .from('encryption_keys')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('is_revoked', false)
      .eq('rotation_enabled', true)
      .lte('next_rotation_at', thirtyDaysFromNow.toISOString());

    return {
      tenantId,
      period: `${days} days`,
      totalEncryptions,
      totalDecryptions,
      byTable,
      byField,
      activeKeys: activeKeys || 0,
      rotatedKeys: rotatedKeys || 0,
      expiringKeys: expiringKeys || 0,
    };
  }
}