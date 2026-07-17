import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { EncryptionKey, KeyType, EncryptionAlgorithm } from "./DataEncryptionTypes";
import { EncryptionEngine } from "./EncryptionEngine.server";
import * as crypto from "crypto";

function mapRow(data: any): EncryptionKey {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    description: data.description,
    type: data.type,
    algorithm: data.algorithm,
    encryptedKeyMaterial: data.encrypted_key_material,
    keyVersion: data.key_version,
    rotationEnabled: data.rotation_enabled,
    rotationIntervalDays: data.rotation_interval_days,
    lastRotatedAt: data.last_rotated_at ? new Date(data.last_rotated_at) : undefined,
    nextRotationAt: data.next_rotation_at ? new Date(data.next_rotation_at) : undefined,
    isActive: data.is_active,
    isRevoked: data.is_revoked,
    revokedAt: data.revoked_at ? new Date(data.revoked_at) : undefined,
    allowedServices: data.allowed_services || [],
    allowedRoles: data.allowed_roles || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by,
  };
}

export class EncryptionKeyManager {
  static async createKey(
    tenantId: string,
    name: string,
    type: KeyType,
    algorithm: EncryptionAlgorithm,
    options: {
      description?: string;
      rotationEnabled?: boolean;
      rotationIntervalDays?: number;
      allowedServices?: string[];
      allowedRoles?: string[];
      createdBy: string;
    },
  ): Promise<EncryptionKey> {
    const keyMaterial = EncryptionEngine.generateKey(algorithm);
    const { encrypted, iv, authTag } = EncryptionEngine.encryptWithMasterKey(keyMaterial);
    const encryptedKeyMaterial = JSON.stringify({ encrypted, iv, authTag });

    const id = `key_${crypto.randomUUID()}`;
    const now = new Date();
    const nextRotationAt = options.rotationEnabled && options.rotationIntervalDays
      ? new Date(Date.now() + options.rotationIntervalDays * 86400000)
      : undefined;

    const { data, error } = await supabaseAdmin
      .from('encryption_keys')
      .insert({
        id,
        tenant_id: tenantId,
        name,
        description: options.description,
        type,
        algorithm,
        encrypted_key_material: encryptedKeyMaterial,
        key_version: 1,
        rotation_enabled: options.rotationEnabled || false,
        rotation_interval_days: options.rotationIntervalDays,
        next_rotation_at: nextRotationAt?.toISOString(),
        is_active: true,
        is_revoked: false,
        allowed_services: options.allowedServices || [],
        allowed_roles: options.allowedRoles || [],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        created_by: options.createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRow(data);
  }

  static async getKey(keyId: string, tenantId: string): Promise<{ key: EncryptionKey; keyMaterial: string } | null> {
    const { data } = await supabaseAdmin
      .from('encryption_keys')
      .select('*')
      .eq('id', keyId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('is_revoked', false)
      .single();
    if (!data) return null;

    const key = mapRow(data);
    const { encrypted, iv, authTag } = JSON.parse(key.encryptedKeyMaterial);
    const keyMaterial = EncryptionEngine.decryptWithMasterKey(encrypted, iv, authTag);
    return { key, keyMaterial };
  }

  static async rotateKey(
    keyId: string,
    tenantId: string,
    rotatedBy: string,
    reason: 'scheduled' | 'manual' | 'compromised' = 'manual',
  ): Promise<EncryptionKey> {
    const { data: existing } = await supabaseAdmin
      .from('encryption_keys')
      .select('*')
      .eq('id', keyId)
      .eq('tenant_id', tenantId)
      .single();
    if (!existing) throw new Error('Key not found');

    const newKeyMaterial = EncryptionEngine.generateKey(existing.algorithm as EncryptionAlgorithm);
    const { encrypted, iv, authTag } = EncryptionEngine.encryptWithMasterKey(newKeyMaterial);
    const encryptedKeyMaterial = JSON.stringify({ encrypted, iv, authTag });
    const newVersion = existing.key_version + 1;
    const nextRotationAt = existing.rotation_interval_days
      ? new Date(Date.now() + existing.rotation_interval_days * 86400000)
      : undefined;

    await supabaseAdmin
      .from('encryption_keys')
      .update({
        encrypted_key_material: encryptedKeyMaterial,
        key_version: newVersion,
        last_rotated_at: new Date().toISOString(),
        next_rotation_at: nextRotationAt?.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId);

    await supabaseAdmin.from('key_rotation_events').insert({
      id: `rotation_${crypto.randomUUID()}`,
      key_id: keyId,
      tenant_id: tenantId,
      from_version: existing.key_version,
      to_version: newVersion,
      rotated_by: rotatedBy,
      rotated_at: new Date().toISOString(),
      reason,
      metadata: {},
    });

    const { data: updated } = await supabaseAdmin
      .from('encryption_keys')
      .select('*')
      .eq('id', keyId)
      .single();
    return mapRow(updated);
  }

  static async revokeKey(keyId: string, tenantId: string, _revokedBy: string, _reason: string): Promise<void> {
    await supabaseAdmin
      .from('encryption_keys')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId)
      .eq('tenant_id', tenantId);
  }

  static async getKeysNeedingRotation(tenantId: string): Promise<EncryptionKey[]> {
    const { data } = await supabaseAdmin
      .from('encryption_keys')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('is_revoked', false)
      .eq('rotation_enabled', true)
      .lte('next_rotation_at', new Date().toISOString());
    return (data || []).map(mapRow);
  }

  static async getKeys(tenantId: string): Promise<EncryptionKey[]> {
    const { data } = await supabaseAdmin
      .from('encryption_keys')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    return (data || []).map(mapRow);
  }
}