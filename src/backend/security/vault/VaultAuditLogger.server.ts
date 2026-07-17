import type { SecretAuditLog } from './SecretsVaultTypes';

export const VaultAuditLogger = {
  async log(entry: Omit<SecretAuditLog, 'id' | 'timestamp'>): Promise<void> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await supabaseAdmin.from('vault_audit_logs' as never).insert({
      id: `audit_${crypto.randomUUID()}`,
      tenant_id: entry.tenantId,
      secret_id: entry.secretId ?? null,
      user_id: entry.userId ?? null,
      action: entry.action,
      success: entry.success,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
      details: entry.details,
      timestamp: new Date().toISOString(),
    } as never);
  },
};