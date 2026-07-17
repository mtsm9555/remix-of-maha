import type { SecretAccessPolicy } from './SecretsVaultTypes';
import { VaultAuditLogger } from './VaultAuditLogger.server';

export const SecretAccessController = {
  async canAccess(
    secretId: string,
    userId: string,
    tenantId: string,
    ipAddress?: string,
  ): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data } = await supabaseAdmin.from('secrets' as never).select('*').eq('id', secretId).eq('tenant_id', tenantId).maybeSingle();
    if (!data) return { allowed: false, reason: 'Not found' };
    const s = data as Record<string, unknown>;
    if (s.is_revoked) return { allowed: false, reason: 'Revoked' };
    if (s.expires_at && new Date(s.expires_at as string) < new Date()) return { allowed: false, reason: 'Expired' };
    const policy = (s.access_policy as SecretAccessPolicy) ?? { allowedUsers: [], allowedRoles: [], allowedWorkspaces: [], requireApproval: false, approvers: [], ipAllowlist: [] };
    if (policy.ipAllowlist?.length && ipAddress && !policy.ipAllowlist.includes(ipAddress)) {
      return { allowed: false, reason: 'IP not allowed' };
    }
    if (policy.allowedUsers.includes(userId)) {
      if (policy.requireApproval) return { allowed: false, requiresApproval: true, reason: 'Approval required' };
      return { allowed: true };
    }
    return { allowed: false, reason: 'Not authorized' };
  },

  async requestAccess(
    secretId: string,
    tenantId: string,
    userId: string,
    reason: string,
    requestedDuration?: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const id = `sar_${crypto.randomUUID()}`;
    await supabaseAdmin.from('secret_access_requests' as never).insert({
      id, secret_id: secretId, tenant_id: tenantId, requested_by: userId, reason,
      requested_duration: requestedDuration ?? null,
      ip_address: ipAddress ?? null, user_agent: userAgent ?? null, status: 'pending',
    } as never);
    await VaultAuditLogger.log({ tenantId, secretId, userId, action: 'access_requested', success: true, details: { reason } });
    return id;
  },

  async approveRequest(requestId: string, approverId: string, tenantId: string): Promise<void> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data } = await supabaseAdmin.from('secret_access_requests' as never).select('*').eq('id', requestId).single();
    const req = data as Record<string, unknown> | null;
    if (!req) throw new Error('Request not found');
    const duration = (req.requested_duration as number | null) ?? 60;
    const now = new Date();
    await supabaseAdmin.from('secret_access_requests' as never).update({
      status: 'approved', approved_by: approverId, approved_at: now.toISOString(),
      access_granted_at: now.toISOString(),
      access_expires_at: new Date(now.getTime() + duration * 60_000).toISOString(),
    } as never).eq('id', requestId);
    await VaultAuditLogger.log({ tenantId, secretId: req.secret_id as string, userId: approverId, action: 'access_approved', success: true, details: { requestId } });
  },

  async rejectRequest(requestId: string, approverId: string, tenantId: string, rejectionReason: string): Promise<void> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await supabaseAdmin.from('secret_access_requests' as never).update({
      status: 'rejected', approved_by: approverId, approved_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    } as never).eq('id', requestId);
    await VaultAuditLogger.log({ tenantId, userId: approverId, action: 'access_rejected', success: true, details: { requestId, rejectionReason } });
  },
};