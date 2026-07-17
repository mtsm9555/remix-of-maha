import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { EncryptedField, DataClassification, EncryptionAlgorithm, EncryptedValue, EncryptionContext } from "./DataEncryptionTypes";
import { EncryptionKeyManager } from "./EncryptionKeyManager.server";
import { EncryptionEngine } from "./EncryptionEngine.server";

export class FieldEncryptionManager {
  private static fieldConfigCache: Map<string, EncryptedField> = new Map();
  private static lastRefresh: Date = new Date(0);
  private static readonly CACHE_TTL_MS = 300000;

  static async configureField(
    tenantId: string,
    tableName: string,
    fieldName: string,
    classification: DataClassification,
    encryptionKeyId: string,
    options: { description?: string; requiresAudit?: boolean; algorithm?: EncryptionAlgorithm } = {},
  ): Promise<EncryptedField> {
    const { data: existing } = await supabaseAdmin
      .from('encrypted_fields')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('table_name', tableName)
      .eq('field_name', fieldName)
      .maybeSingle();
    if (existing) throw new Error(`Field ${tableName}.${fieldName} is already configured`);

    const now = new Date();
    const field: EncryptedField = {
      tableName,
      fieldName,
      classification,
      encryptionKeyId,
      algorithm: options.algorithm || 'AES-256-GCM',
      description: options.description,
      requiresAudit: options.requiresAudit !== false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await supabaseAdmin.from('encrypted_fields').insert({
      tenant_id: tenantId,
      table_name: tableName,
      field_name: fieldName,
      classification,
      encryption_key_id: encryptionKeyId,
      algorithm: field.algorithm,
      description: field.description,
      requires_audit: field.requiresAudit,
      is_active: true,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    this.fieldConfigCache.clear();
    return field;
  }

  static async encryptField(
    tenantId: string,
    tableName: string,
    fieldName: string,
    plaintext: string,
    userId?: string,
  ): Promise<EncryptedValue> {
    const fieldConfig = await this.getFieldConfig(tenantId, tableName, fieldName);
    if (!fieldConfig) throw new Error(`Field ${tableName}.${fieldName} not configured`);
    const keyData = await EncryptionKeyManager.getKey(fieldConfig.encryptionKeyId, tenantId);
    if (!keyData) throw new Error('Encryption key not found or inactive');

    const context: EncryptionContext = {
      tenantId, userId, service: 'field-encryption', operation: 'encrypt', tableName, fieldName,
    };
    return EncryptionEngine.encrypt(plaintext, keyData.keyMaterial, fieldConfig.algorithm, keyData.key.keyVersion, context);
  }

  static async decryptField(
    tenantId: string,
    tableName: string,
    fieldName: string,
    encrypted: EncryptedValue,
    userId?: string,
  ): Promise<string> {
    const fieldConfig = await this.getFieldConfig(tenantId, tableName, fieldName);
    if (!fieldConfig) throw new Error(`Field ${tableName}.${fieldName} not configured`);
    const keyData = await EncryptionKeyManager.getKey(fieldConfig.encryptionKeyId, tenantId);
    if (!keyData) throw new Error('Encryption key not found or inactive');
    const context: EncryptionContext = {
      tenantId, userId, service: 'field-encryption', operation: 'decrypt', tableName, fieldName,
    };
    return EncryptionEngine.decrypt(encrypted, keyData.keyMaterial, context);
  }

  static async encryptRecord(
    tenantId: string,
    tableName: string,
    record: Record<string, any>,
    userId?: string,
  ): Promise<Record<string, any>> {
    const result = { ...record };
    const configs = await this.getTableFieldConfigs(tenantId, tableName);
    for (const cfg of configs) {
      if (record[cfg.fieldName] !== undefined && record[cfg.fieldName] !== null) {
        const enc = await this.encryptField(tenantId, tableName, cfg.fieldName, String(record[cfg.fieldName]), userId);
        result[cfg.fieldName] = JSON.stringify(enc);
      }
    }
    return result;
  }

  static async decryptRecord(
    tenantId: string,
    tableName: string,
    record: Record<string, any>,
    userId?: string,
  ): Promise<Record<string, any>> {
    const result = { ...record };
    const configs = await this.getTableFieldConfigs(tenantId, tableName);
    for (const cfg of configs) {
      if (record[cfg.fieldName] !== undefined && record[cfg.fieldName] !== null) {
        try {
          const enc: EncryptedValue = JSON.parse(record[cfg.fieldName]);
          result[cfg.fieldName] = await this.decryptField(tenantId, tableName, cfg.fieldName, enc, userId);
        } catch (err: any) {
          console.error(`[FieldEncryptionManager] Failed to decrypt ${cfg.fieldName}:`, err.message);
        }
      }
    }
    return result;
  }

  private static async getFieldConfig(tenantId: string, tableName: string, fieldName: string): Promise<EncryptedField | null> {
    await this.refreshCacheIfNeeded(tenantId);
    return this.fieldConfigCache.get(`${tenantId}:${tableName}:${fieldName}`) || null;
  }

  private static async getTableFieldConfigs(tenantId: string, tableName: string): Promise<EncryptedField[]> {
    await this.refreshCacheIfNeeded(tenantId);
    return Array.from(this.fieldConfigCache.values()).filter(f => f.tableName === tableName && f.isActive);
  }

  private static async refreshCacheIfNeeded(tenantId: string): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastRefresh.getTime() < this.CACHE_TTL_MS && this.fieldConfigCache.size > 0) return;

    const { data } = await supabaseAdmin
      .from('encrypted_fields')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    this.fieldConfigCache.clear();
    for (const f of data || []) {
      const key = `${tenantId}:${f.table_name}:${f.field_name}`;
      this.fieldConfigCache.set(key, {
        tableName: f.table_name,
        fieldName: f.field_name,
        classification: f.classification,
        encryptionKeyId: f.encryption_key_id,
        algorithm: f.algorithm,
        description: f.description,
        requiresAudit: f.requires_audit,
        isActive: f.is_active,
        createdAt: new Date(f.created_at),
        updatedAt: new Date(f.updated_at),
      });
    }
    this.lastRefresh = now;
  }

  static async getConfiguredFields(tenantId: string): Promise<EncryptedField[]> {
    const { data } = await supabaseAdmin
      .from('encrypted_fields')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('table_name', { ascending: true })
      .order('field_name', { ascending: true });
    return (data || []).map((f: any) => ({
      tableName: f.table_name,
      fieldName: f.field_name,
      classification: f.classification,
      encryptionKeyId: f.encryption_key_id,
      algorithm: f.algorithm,
      description: f.description,
      requiresAudit: f.requires_audit,
      isActive: f.is_active,
      createdAt: new Date(f.created_at),
      updatedAt: new Date(f.updated_at),
    }));
  }
}