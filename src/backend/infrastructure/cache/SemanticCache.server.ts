import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CacheEntry, CacheEntryType } from "./CacheLayerTypes";

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export class SemanticCache {
  static async findSimilar(
    tenantId: string,
    embedding: number[],
    threshold = 0.92
  ): Promise<{ entry: CacheEntry; similarity: number } | null> {
    const { data } = await supabaseAdmin
      .from("cache_entries")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("level", "SEMANTIC")
      .gt("expires_at", new Date().toISOString())
      .limit(500);
    if (!data || data.length === 0) return null;

    let best: { row: Record<string, unknown>; sim: number } | null = null;
    for (const row of data) {
      const emb = row.embedding as number[] | null;
      if (!emb) continue;
      const sim = cosine(embedding, emb);
      if (!best || sim > best.sim) best = { row: row as Record<string, unknown>, sim };
    }
    if (!best || best.sim < threshold) return null;
    return {
      similarity: best.sim,
      entry: {
        id: String(best.row.id),
        key: String(best.row.key),
        level: "SEMANTIC",
        type: best.row.type as CacheEntryType,
        value: JSON.parse(String(best.row.serialized_value)),
        serializedValue: String(best.row.serialized_value),
        sizeBytes: Number(best.row.size_bytes ?? 0),
        tenantId,
        createdAt: new Date(String(best.row.created_at)),
        expiresAt: new Date(String(best.row.expires_at)),
        lastAccessedAt: new Date(String(best.row.last_accessed_at)),
        accessCount: Number(best.row.access_count ?? 0),
        invalidationTags: (best.row.invalidation_tags as string[]) ?? [],
        version: Number(best.row.version ?? 1),
        hitCount: Number(best.row.hit_count ?? 0),
        missCount: Number(best.row.miss_count ?? 0),
      },
    };
  }

  static async store(
    tenantId: string,
    key: string,
    type: CacheEntryType,
    value: unknown,
    embedding: number[],
    ttlSeconds = 86400
  ): Promise<void> {
    const serialized = JSON.stringify(value);
    await supabaseAdmin.from("cache_entries").upsert(
      {
        key: `sem:${tenantId}:${key}`,
        level: "SEMANTIC",
        type,
        serialized_value: serialized,
        size_bytes: new TextEncoder().encode(serialized).length,
        tenant_id: tenantId,
        embedding,
        expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
        last_accessed_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,key,level" }
    );
  }
}