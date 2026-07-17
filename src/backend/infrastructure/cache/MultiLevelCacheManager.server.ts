import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CacheEntry, CacheRequest, CacheResult, CacheLevel, CacheEntryType } from "./CacheLayerTypes";

/**
 * Worker-compatible multi-level cache: L1 (per-instance in-memory, best-effort)
 * + L3 (Supabase database). L2 Redis and semantic layers are stubs — the API
 * shape is preserved so tenants can enable them later without code changes.
 */

interface L1Slot {
  entry: CacheEntry;
  expiresAtMs: number;
}

const L1_MAX_ENTRIES = 1024;
const l1: Map<string, L1Slot> = new Map();

function buildKey(key: string, tenantId: string): string {
  return `t:${tenantId}:${key}`;
}

function serialize(value: unknown): { serialized: string; sizeBytes: number } {
  const serialized = JSON.stringify(value ?? null);
  return { serialized, sizeBytes: new TextEncoder().encode(serialized).length };
}

function deserialize(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return null; }
}

function evictL1IfNeeded(): void {
  if (l1.size <= L1_MAX_ENTRIES) return;
  // Simple LRU: drop oldest inserted keys (Map preserves insertion order)
  const toRemove = l1.size - L1_MAX_ENTRIES;
  const it = l1.keys();
  for (let i = 0; i < toRemove; i++) {
    const k = it.next().value;
    if (k) l1.delete(k);
  }
}

function getFromL1(cacheKey: string): CacheEntry | null {
  const slot = l1.get(cacheKey);
  if (!slot) return null;
  if (slot.expiresAtMs < Date.now()) {
    l1.delete(cacheKey);
    return null;
  }
  // Refresh LRU position
  l1.delete(cacheKey);
  l1.set(cacheKey, slot);
  slot.entry.hitCount++;
  slot.entry.lastAccessedAt = new Date();
  return slot.entry;
}

function setInL1(cacheKey: string, entry: CacheEntry): void {
  l1.set(cacheKey, { entry, expiresAtMs: entry.expiresAt.getTime() });
  evictL1IfNeeded();
}

async function getFromL3(cacheKey: string, tenantId: string): Promise<CacheEntry | null> {
  const { data, error } = await supabaseAdmin
    .from("cache_entries")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("key", cacheKey)
    .eq("level", "L3_DATABASE")
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from("cache_entries").delete().eq("id", data.id);
    return null;
  }
  await supabaseAdmin
    .from("cache_entries")
    .update({
      hit_count: (data.hit_count ?? 0) + 1,
      access_count: (data.access_count ?? 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq("id", data.id);
  return rowToEntry(data);
}

function rowToEntry(row: Record<string, unknown>): CacheEntry {
  return {
    id: String(row.id),
    key: String(row.key),
    level: row.level as CacheLevel,
    type: row.type as CacheEntryType,
    value: deserialize(String(row.serialized_value)),
    serializedValue: String(row.serialized_value),
    sizeBytes: Number(row.size_bytes ?? 0),
    tenantId: (row.tenant_id as string | null) ?? null,
    workspaceId: (row.workspace_id as string | null) ?? null,
    correlationId: (row.correlation_id as string | null) ?? null,
    createdAt: new Date(String(row.created_at)),
    expiresAt: new Date(String(row.expires_at)),
    lastAccessedAt: new Date(String(row.last_accessed_at)),
    accessCount: Number(row.access_count ?? 0),
    invalidationTags: (row.invalidation_tags as string[]) ?? [],
    version: Number(row.version ?? 1),
    hitCount: Number(row.hit_count ?? 0),
    missCount: Number(row.miss_count ?? 0),
    originalCostUSD: (row.original_cost_usd as number | undefined) ?? undefined,
    savedCostUSD: (row.saved_cost_usd as number | undefined) ?? undefined,
  };
}

export class MultiLevelCacheManager {
  static async get(request: Omit<CacheRequest, "value">): Promise<CacheResult> {
    const startTime = Date.now();
    const cacheKey = buildKey(request.key, request.tenantId);

    const l1Hit = getFromL1(cacheKey);
    if (l1Hit) {
      return {
        hit: true,
        value: l1Hit.value,
        level: "L1_MEMORY",
        entry: l1Hit,
        lookupTimeMs: Date.now() - startTime,
        savedCostUSD: request.originalCostUSD,
      };
    }

    const l3Hit = await getFromL3(cacheKey, request.tenantId);
    if (l3Hit) {
      setInL1(cacheKey, l3Hit);
      return {
        hit: true,
        value: l3Hit.value,
        level: "L3_DATABASE",
        entry: l3Hit,
        lookupTimeMs: Date.now() - startTime,
        savedCostUSD: request.originalCostUSD,
      };
    }

    return { hit: false, lookupTimeMs: Date.now() - startTime };
  }

  static async set(request: CacheRequest): Promise<CacheEntry> {
    const cacheKey = buildKey(request.key, request.tenantId);
    const ttl = request.ttlSeconds ?? 3600;
    const now = new Date();
    const expires = new Date(now.getTime() + ttl * 1000);
    const { serialized, sizeBytes } = serialize(request.value);

    const { data, error } = await supabaseAdmin
      .from("cache_entries")
      .upsert(
        {
          key: cacheKey,
          level: "L3_DATABASE",
          type: request.type,
          serialized_value: serialized,
          size_bytes: sizeBytes,
          tenant_id: request.tenantId,
          workspace_id: request.workspaceId ?? null,
          expires_at: expires.toISOString(),
          last_accessed_at: now.toISOString(),
          invalidation_tags: request.invalidationTags ?? [],
          original_cost_usd: request.originalCostUSD ?? null,
        },
        { onConflict: "tenant_id,key,level" }
      )
      .select("*")
      .single();
    if (error) throw error;

    const entry = rowToEntry(data);
    setInL1(cacheKey, entry);
    return entry;
  }

  static async invalidate(tenantId: string, key: string): Promise<number> {
    const cacheKey = buildKey(key, tenantId);
    l1.delete(cacheKey);
    const { data } = await supabaseAdmin
      .from("cache_entries")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("key", cacheKey)
      .select("id");
    return data?.length ?? 0;
  }

  static async invalidateByTag(tenantId: string, tag: string): Promise<number> {
    const { data } = await supabaseAdmin
      .from("cache_entries")
      .delete()
      .eq("tenant_id", tenantId)
      .contains("invalidation_tags", [tag])
      .select("id, key");
    for (const row of data ?? []) l1.delete(String(row.key));
    await supabaseAdmin.from("cache_invalidation_events").insert({
      tenant_id: tenantId,
      scope: "tag",
      target: tag,
      entries_removed: data?.length ?? 0,
    });
    return data?.length ?? 0;
  }

  static async purgeExpired(): Promise<number> {
    const { data } = await supabaseAdmin
      .from("cache_entries")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");
    return data?.length ?? 0;
  }

  static async getStats(tenantId: string): Promise<{
    entryCount: number;
    totalSizeBytes: number;
    totalHits: number;
    totalMisses: number;
    hitRate: number;
  }> {
    const { data } = await supabaseAdmin
      .from("cache_entries")
      .select("size_bytes, hit_count, miss_count")
      .eq("tenant_id", tenantId);
    const rows = data ?? [];
    const totalSizeBytes = rows.reduce((s, r) => s + Number(r.size_bytes ?? 0), 0);
    const totalHits = rows.reduce((s, r) => s + Number(r.hit_count ?? 0), 0);
    const totalMisses = rows.reduce((s, r) => s + Number(r.miss_count ?? 0), 0);
    const total = totalHits + totalMisses;
    return {
      entryCount: rows.length,
      totalSizeBytes,
      totalHits,
      totalMisses,
      hitRate: total > 0 ? totalHits / total : 0,
    };
  }
}