import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHash, randomBytes } from "crypto";
import type { AdvancedApiKey, ApiKeyScope } from "./AdvancedApiKeyTypes";

function mapToApiKey(d: any): AdvancedApiKey {
  return {
    id: d.id,
    tenantId: d.tenant_id,
    name: d.name,
    description: d.description,
    keyPrefix: d.key_prefix,
    status: d.status,
    scopes: d.scopes ?? [],
    allowedEndpoints: d.allowed_endpoints ?? [],
    allowedDepartments: d.allowed_departments ?? [],
    rateLimitPerMinute: d.rate_limit_per_minute,
    rateLimitPerDay: d.rate_limit_per_day,
    ipAllowlist: d.ip_allowlist ?? [],
    ipBlocklist: d.ip_blocklist ?? [],
    expiresAt: d.expires_at ? new Date(d.expires_at) : null,
    lastUsedAt: d.last_used_at ? new Date(d.last_used_at) : null,
    lastUsedIp: d.last_used_ip,
    totalRequests: Number(d.total_requests ?? 0),
    requestsToday: Number(d.requests_today ?? 0),
    requestsThisMonth: Number(d.requests_this_month ?? 0),
    createdBy: d.created_by,
    createdAt: new Date(d.created_at),
    updatedAt: d.updated_at ? new Date(d.updated_at) : new Date(d.created_at),
    revokedAt: d.revoked_at ? new Date(d.revoked_at) : null,
    revokedBy: d.revoked_by,
    revocationReason: d.revocation_reason,
    rotationPolicy: d.rotation_policy ?? null,
  };
}

function hashKey(k: string) { return createHash("sha256").update(k).digest("hex"); }
function generateKey() { return `maha_sk_${randomBytes(32).toString("hex")}`; }
function ipMatches(ip: string, pattern: string) {
  if (pattern.includes("/")) {
    const [base] = pattern.split("/");
    return ip.startsWith(base.substring(0, base.lastIndexOf(".")));
  }
  return ip === pattern;
}

export class AdvancedApiKeyManager {
  static async createApiKey(
    tenantId: string,
    name: string,
    scopes: ApiKeyScope[],
    options: {
      description?: string;
      allowedEndpoints?: string[];
      allowedDepartments?: string[];
      rateLimitPerMinute?: number;
      rateLimitPerDay?: number;
      ipAllowlist?: string[];
      expiresAt?: Date;
      rotationPolicy?: AdvancedApiKey["rotationPolicy"];
      createdBy: string;
    },
  ): Promise<{ apiKey: AdvancedApiKey; plaintextKey: string }> {
    const plaintextKey = generateKey();
    const keyHash = hashKey(plaintextKey);
    const keyPrefix = plaintextKey.substring(0, 12);
    const id = `key_${crypto.randomUUID()}`;

    const { data, error } = await supabaseAdmin.from("api_keys").insert({
      id,
      tenant_id: tenantId,
      name,
      description: options.description ?? null,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      status: "active",
      scopes,
      permissions: scopes,
      allowed_endpoints: options.allowedEndpoints ?? ["*"],
      allowed_departments: options.allowedDepartments ?? [],
      rate_limit_per_minute: options.rateLimitPerMinute ?? 60,
      rate_limit_per_day: options.rateLimitPerDay ?? 10000,
      ip_allowlist: options.ipAllowlist ?? [],
      ip_blocklist: [],
      expires_at: options.expiresAt?.toISOString() ?? null,
      rotation_policy: options.rotationPolicy ?? null,
      created_by: options.createdBy,
    }).select().single();
    if (error) throw error;

    await this.logAuditEvent(id, tenantId, "created", options.createdBy, {
      name, scopes, keyPrefix,
    });

    return { apiKey: mapToApiKey(data), plaintextKey };
  }

  static async validateApiKey(key: string, endpoint: string, ipAddress: string) {
    const { data } = await supabaseAdmin.from("api_keys")
      .select("*").eq("key_hash", hashKey(key)).maybeSingle();
    if (!data) return { valid: false as const, reason: "Invalid API key" };

    const apiKey = mapToApiKey(data);
    if (apiKey.status !== "active") return { valid: false as const, apiKey, reason: `API key is ${apiKey.status}` };

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      await this.updateKeyStatus(apiKey.id, "expired");
      return { valid: false as const, apiKey, reason: "API key has expired" };
    }

    if (apiKey.ipAllowlist.length > 0 && !apiKey.ipAllowlist.some(p => ipMatches(ipAddress, p))) {
      await this.logAuditEvent(apiKey.id, apiKey.tenantId, "ip_blocked", "system", { ipAddress });
      return { valid: false as const, apiKey, reason: "IP address not in allowlist" };
    }
    if (apiKey.ipBlocklist.length > 0 && apiKey.ipBlocklist.some(p => ipMatches(ipAddress, p))) {
      await this.logAuditEvent(apiKey.id, apiKey.tenantId, "ip_blocked", "system", { ipAddress });
      return { valid: false as const, apiKey, reason: "IP address is blocked" };
    }
    if (!apiKey.allowedEndpoints.includes("*")) {
      const ok = apiKey.allowedEndpoints.some(a => endpoint.startsWith(a) || a === endpoint);
      if (!ok) return { valid: false as const, apiKey, reason: "Endpoint not allowed for this API key" };
    }

    await supabaseAdmin.from("api_keys").update({
      last_used_at: new Date().toISOString(),
      last_used_ip: ipAddress,
      updated_at: new Date().toISOString(),
    }).eq("id", apiKey.id);

    return { valid: true as const, apiKey };
  }

  static async revokeApiKey(apiKeyId: string, tenantId: string, revokedBy: string, reason: string) {
    await supabaseAdmin.from("api_keys").update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revocation_reason: reason,
      updated_at: new Date().toISOString(),
    }).eq("id", apiKeyId).eq("tenant_id", tenantId);
    await this.logAuditEvent(apiKeyId, tenantId, "revoked", revokedBy, { reason });
  }

  static async rotateApiKey(apiKeyId: string, tenantId: string, rotatedBy: string) {
    const { data: oldKey } = await supabaseAdmin.from("api_keys")
      .select("*").eq("id", apiKeyId).eq("tenant_id", tenantId).single();
    if (!oldKey) throw new Error("API key not found");

    const created = await this.createApiKey(tenantId, `${oldKey.name} (Rotated)`, oldKey.scopes ?? [], {
      description: oldKey.description ?? undefined,
      allowedEndpoints: oldKey.allowed_endpoints ?? undefined,
      allowedDepartments: oldKey.allowed_departments ?? undefined,
      rateLimitPerMinute: oldKey.rate_limit_per_minute,
      rateLimitPerDay: oldKey.rate_limit_per_day,
      ipAllowlist: oldKey.ip_allowlist ?? undefined,
      expiresAt: oldKey.expires_at ? new Date(oldKey.expires_at) : undefined,
      rotationPolicy: oldKey.rotation_policy ?? undefined,
      createdBy: rotatedBy,
    });

    await this.revokeApiKey(apiKeyId, tenantId, rotatedBy, "Key rotated");
    await this.logAuditEvent(apiKeyId, tenantId, "rotated", rotatedBy, { newKeyId: created.apiKey.id });
    return { newApiKey: created.apiKey, plaintextKey: created.plaintextKey };
  }

  static async checkRateLimit(apiKeyId: string) {
    const { data: key } = await supabaseAdmin.from("api_keys")
      .select("rate_limit_per_minute, rate_limit_per_day, requests_today")
      .eq("id", apiKeyId).single();
    if (!key) return { allowed: false, remaining: 0 };
    if (Number(key.requests_today) >= Number(key.rate_limit_per_day)) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: Number(key.rate_limit_per_day) - Number(key.requests_today) };
  }

  static async incrementUsage(apiKeyId: string) {
    const { data } = await supabaseAdmin.from("api_keys")
      .select("total_requests, requests_today, requests_this_month")
      .eq("id", apiKeyId).single();
    if (!data) return;
    await supabaseAdmin.from("api_keys").update({
      total_requests: Number(data.total_requests ?? 0) + 1,
      requests_today: Number(data.requests_today ?? 0) + 1,
      requests_this_month: Number(data.requests_this_month ?? 0) + 1,
    }).eq("id", apiKeyId);
  }

  static async getApiKeys(tenantId: string) {
    const { data } = await supabaseAdmin.from("api_keys")
      .select("id, tenant_id, name, description, key_prefix, status, scopes, allowed_endpoints, allowed_departments, rate_limit_per_minute, rate_limit_per_day, ip_allowlist, ip_blocklist, expires_at, last_used_at, last_used_ip, total_requests, requests_today, requests_this_month, created_by, created_at, updated_at, rotation_policy, revoked_at, revoked_by, revocation_reason")
      .eq("tenant_id", tenantId).order("created_at", { ascending: false });
    return (data ?? []).map(mapToApiKey);
  }

  static async updateApiKey(apiKeyId: string, tenantId: string, updates: Record<string, any>, performedBy: string) {
    const allowed = ["name","description","allowed_endpoints","allowed_departments","rate_limit_per_minute","rate_limit_per_day","ip_allowlist","ip_blocklist","rotation_policy"];
    const filtered: Record<string, any> = {};
    for (const k of allowed) if (updates[k] !== undefined) filtered[k] = updates[k];
    filtered.updated_at = new Date().toISOString();
    await supabaseAdmin.from("api_keys").update(filtered).eq("id", apiKeyId).eq("tenant_id", tenantId);
    await this.logAuditEvent(apiKeyId, tenantId, "updated", performedBy, { updatedFields: Object.keys(filtered) });
  }

  static async resetUsageCounters() {
    await supabaseAdmin.from("api_keys").update({ requests_today: 0 }).neq("id", "");
    if (new Date().getDate() === 1) {
      await supabaseAdmin.from("api_keys").update({ requests_this_month: 0 }).neq("id", "");
    }
  }

  private static async updateKeyStatus(apiKeyId: string, status: string) {
    await supabaseAdmin.from("api_keys").update({ status, updated_at: new Date().toISOString() }).eq("id", apiKeyId);
  }

  static async logAuditEvent(apiKeyId: string, tenantId: string, action: string, performedBy: string, details: Record<string, any>, ipAddress?: string) {
    await supabaseAdmin.from("api_key_audit_logs").insert({
      api_key_id: apiKeyId, tenant_id: tenantId, action, performed_by: performedBy, details, ip_address: ipAddress ?? null,
    });
  }
}