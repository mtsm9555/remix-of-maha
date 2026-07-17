import { EncryptionEngine } from './EncryptionEngine.server';
import { VaultAuditLogger } from './VaultAuditLogger.server';
import type { Secret, SecretType, SecretAccessPolicy, DecryptedSecret } from './SecretsVaultTypes';

const DEFAULT_POLICY: SecretAccessPolicy = {
  allowedRoles: [],
  allowedUsers: [],
  allowedWorkspaces: [],
  requireApproval: false,
  approvers: [],
  ipAllowlist: [],
};

function rowToSecret(row: Record<string, unknown>): Secret {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    workspaceId: (row.workspace_id as string | null) ?? undefined,
    name: row.name as string,
    description: (row.description as string | null) ?? undefined,
    type: row.type as SecretType,
    tags: (row.tags as string[]) ?? [],
    encryptedValue: row.encrypted_value as string,
    encryptionKeyId: row.encryption_key_id as string,
    encryptionAlgorithm: 'AES-256-GCM',
    version: row.version as number,
    rotationEnabled: row.rotation_enabled as boolean,
    rotationIntervalDays: (row.rotation_interval_days as number | null) ?? undefined,
    lastRotatedAt: (row.last_rotated_at as string | null) ?? undefined,
    nextRotationAt: (row.next_rotation_at as string | null) ?? undefined,
    rotationStatus: row.rotation_status as Secret['rotationStatus'],
    accessPolicy: (row.access_policy as SecretAccessPolicy) ?? DEFAULT_POLICY,
    expiresAt: (row.expires_at as string | null) ?? undefined,
    isRevoked: row.is_revoked as boolean,
    accessCount: row.access_count as number,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: row.created_by as string,
  };
}

export const SecretsManager = {
  async createSecret(
    tenantId: string,
    name: string,
    value: string,
    options: {
      description?: string;
      type?: SecretType;
      tags?: string[];
      workspaceId?: string;
      accessPolicy?: Partial<SecretAccessPolicy>;
      rotationEnabled?: boolean;
      rotationIntervalDays?: number;
      expiresAt?: string;
      metadata?: Record<string, unknown>;
      createdBy: string;
    },
  ): Promise<Secret> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { encrypted, iv, authTag } = await EncryptionEngine.encrypt(value);
    const id = `secret_${crypto.randomUUID()}`;
    const now = new Date();
    const nextRotationAt = options.rotationEnabled && options.rotationIntervalDays
      ? new Date(now.getTime() + options.rotationIntervalDays * 86400_000).toISOString()
      : null;

    const policy: SecretAccessPolicy = {
      ...DEFAULT_POLICY,
      allowedUsers: [options.createdBy],
      ...options.accessPolicy,
    };

    const row = {
      id,
      tenant_id: tenantId,
      workspace_id: options.workspaceId ?? null,
      name,
      description: options.description ?? null,
      type: options.type ?? 'custom',
      tags: options.tags ?? [],
      encrypted_value: JSON.stringify({ encrypted, iv, authTag }),
      encryption_key_id: 'master',
      encryption_algorithm: 'AES-256-GCM',
      version: 1,
      rotation_enabled: options.rotationEnabled ?? false,
      rotation_interval_days: options.rotationIntervalDays ?? null,
      next_rotation_at: nextRotationAt,
      rotation_status: 'active',
      access_policy: policy,
      expires_at: options.expiresAt ?? null,
      is_revoked: false,
      access_count: 0,
      metadata: options.metadata ?? {},
      created_by: options.createdBy,
    };
    const { data, error } = await supabaseAdmin.from('secrets' as never).insert(row as never).select().single();
    if (error) throw error;
    await VaultAuditLogger.log({
      tenantId, secretId: id, userId: options.createdBy, action: 'created', success: true, details: { name },
    });
    return rowToSecret(data as Record<string, unknown>);
  },

  async getSecret(secretId: string, tenantId: string): Promise<Secret | null> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data } = await supabaseAdmin.from('secrets' as never).select('*').eq('id', secretId).eq('tenant_id', tenantId).maybeSingle();
    return data ? rowToSecret(data as Record<string, unknown>) : null;
  },

  async listSecrets(tenantId: string): Promise<Secret[]> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data } = await supabaseAdmin.from('secrets' as never).select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
    return (data ?? []).map((r) => rowToSecret(r as Record<string, unknown>));
  },

  async revealSecret(secretId: string, tenantId: string, userId: string, ipAddress?: string): Promise<DecryptedSecret> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const secret = await this.getSecret(secretId, tenantId);
    if (!secret) throw new Error('Secret not found');
    if (secret.isRevoked) throw new Error('Secret revoked');
    const parsed = JSON.parse(secret.encryptedValue) as { encrypted: string; iv: string; authTag: string };
    const value = await EncryptionEngine.decrypt(parsed.encrypted, parsed.iv, parsed.authTag);
    await supabaseAdmin.from('secrets' as never).update({
      access_count: secret.accessCount + 1,
      last_accessed_at: new Date().toISOString(),
      last_accessed_by: userId,
    } as never).eq('id', secretId);
    await VaultAuditLogger.log({
      tenantId, secretId, userId, action: 'accessed', success: true, ipAddress, details: {},
    });
    const { encryptedValue: _e, ...rest } = secret;
    return { ...rest, value };
  },

  async rotateSecret(
    secretId: string,
    rotatedBy: string,
    reason: 'manual' | 'scheduled' | 'compromised',
    newValue?: string,
  ): Promise<Secret> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const existing = await supabaseAdmin.from('secrets' as never).select('*').eq('id', secretId).single();
    if (existing.error || !existing.data) throw existing.error ?? new Error('Not found');
    const current = rowToSecret(existing.data as Record<string, unknown>);

    // archive current
    await supabaseAdmin.from('secret_versions' as never).insert({
      id: `sv_${crypto.randomUUID()}`,
      secret_id: secretId,
      version: current.version,
      encrypted_value: current.encryptedValue,
      encryption_key_id: current.encryptionKeyId,
      rotation_reason: reason,
      rotated_by: rotatedBy,
      created_by: rotatedBy,
    } as never);

    const value = newValue ?? crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const { encrypted, iv, authTag } = await EncryptionEngine.encrypt(value);
    const now = new Date();
    const nextRotationAt = current.rotationEnabled && current.rotationIntervalDays
      ? new Date(now.getTime() + current.rotationIntervalDays * 86400_000).toISOString()
      : null;
    const { data, error } = await supabaseAdmin.from('secrets' as never).update({
      encrypted_value: JSON.stringify({ encrypted, iv, authTag }),
      version: current.version + 1,
      last_rotated_at: now.toISOString(),
      next_rotation_at: nextRotationAt,
      rotation_status: 'active',
    } as never).eq('id', secretId).select().single();
    if (error) throw error;
    await VaultAuditLogger.log({
      tenantId: current.tenantId, secretId, userId: rotatedBy, action: 'rotated', success: true, details: { reason },
    });
    return rowToSecret(data as Record<string, unknown>);
  },

  async revokeSecret(secretId: string, tenantId: string, userId: string): Promise<void> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await supabaseAdmin.from('secrets' as never).update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by: userId,
      rotation_status: 'revoked',
    } as never).eq('id', secretId).eq('tenant_id', tenantId);
    await VaultAuditLogger.log({
      tenantId, secretId, userId, action: 'revoked', success: true, details: {},
    });
  },

  async getSecretsNeedingRotation(tenantId: string): Promise<Secret[]> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data } = await supabaseAdmin.from('secrets' as never)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('rotation_enabled', true)
      .eq('is_revoked', false)
      .lte('next_rotation_at', new Date().toISOString());
    return (data ?? []).map((r) => rowToSecret(r as Record<string, unknown>));
  },
};