import { createHash, randomBytes } from "crypto";
import type { ApiKey, Permission } from "./OrganizationTypes";

export class ApiKeyManager {
  static async createApiKey(
    tenantId: string,
    name: string,
    permissions: Permission[],
    rateLimitPerMinute: number,
    createdBy: string,
    expiresAt?: Date,
  ): Promise<{ apiKey: ApiKey; plaintextKey: string }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const plaintextKey = `maha_sk_${randomBytes(32).toString("hex")}`;
    const keyHash = createHash("sha256").update(plaintextKey).digest("hex");
    const keyPrefix = plaintextKey.substring(0, 12);
    const id = `key_${crypto.randomUUID()}`;
    const { error } = await supabaseAdmin.from("api_keys" as never).insert({
      id,
      tenant_id: tenantId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions,
      rate_limit_per_minute: rateLimitPerMinute,
      created_by: createdBy,
      expires_at: expiresAt?.toISOString() ?? null,
    } as never);
    if (error) throw new Error(error.message);
    const apiKey: ApiKey = {
      id, tenantId, name, keyHash, keyPrefix, permissions,
      rateLimitPerMinute, createdBy, expiresAt, createdAt: new Date(),
    };
    return { apiKey, plaintextKey };
  }

  static async validateApiKey(
    key: string,
  ): Promise<{ tenantId: string; permissions: Permission[] } | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const keyHash = createHash("sha256").update(key).digest("hex");
    const { data } = await supabaseAdmin
      .from("api_keys" as never)
      .select("tenant_id, permissions, expires_at")
      .eq("key_hash", keyHash)
      .maybeSingle();
    if (!data) return null;
    const row = data as { tenant_id: string; permissions: Permission[]; expires_at: string | null };
    if (row.expires_at && new Date() > new Date(row.expires_at)) return null;
    void supabaseAdmin
      .from("api_keys" as never)
      .update({ last_used_at: new Date().toISOString() } as never)
      .eq("key_hash", keyHash);
    return { tenantId: row.tenant_id, permissions: row.permissions };
  }

  static async revokeApiKey(tenantId: string, keyId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("api_keys" as never)
      .delete()
      .eq("id", keyId)
      .eq("tenant_id", tenantId);
  }

  static async getApiKeys(tenantId: string): Promise<Array<Omit<ApiKey, "keyHash">>> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("api_keys" as never)
      .select("id, tenant_id, name, key_prefix, permissions, rate_limit_per_minute, created_by, last_used_at, expires_at, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    return ((data ?? []) as unknown as Array<Omit<ApiKey, "keyHash">>);
  }
}