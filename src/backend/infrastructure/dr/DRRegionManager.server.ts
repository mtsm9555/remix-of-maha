import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { DRRegion, ReplicationStatusType } from "./DisasterRecoveryTypes";

function rowToRegion(r: Record<string, unknown>): DRRegion {
  return {
    id: String(r.id),
    tenantId: String(r.tenant_id),
    regionName: String(r.region_name),
    status: r.status as DRRegion["status"],
    databaseEndpoint: String(r.database_endpoint),
    cacheEndpoint: String(r.cache_endpoint),
    storageEndpoint: String(r.storage_endpoint),
    apiEndpoint: String(r.api_endpoint),
    isHealthy: Boolean(r.is_healthy),
    lastHealthCheckAt: new Date(String(r.last_health_check_at)),
    healthScore: Number(r.health_score ?? 100),
    replicationStatus: r.replication_status as ReplicationStatusType,
    replicationLagSeconds: Number(r.replication_lag_seconds ?? 0),
    lastReplicatedAt: new Date(String(r.last_replicated_at)),
    cpuUtilization: Number(r.cpu_utilization ?? 0),
    memoryUtilization: Number(r.memory_utilization ?? 0),
    storageUtilization: Number(r.storage_utilization ?? 0),
    isPrimary: Boolean(r.is_primary),
    failoverPriority: Number(r.failover_priority ?? 10),
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(String(r.created_at)),
    updatedAt: new Date(String(r.updated_at)),
  };
}

export class DRRegionManager {
  static async registerRegion(
    tenantId: string,
    regionName: string,
    config: {
      databaseEndpoint: string;
      cacheEndpoint: string;
      storageEndpoint: string;
      apiEndpoint: string;
      isPrimary?: boolean;
      failoverPriority?: number;
    },
  ): Promise<DRRegion> {
    const id = `region_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("dr_regions" as never)
      .insert({
        id,
        tenant_id: tenantId,
        region_name: regionName,
        status: "dr_standby",
        database_endpoint: config.databaseEndpoint,
        cache_endpoint: config.cacheEndpoint,
        storage_endpoint: config.storageEndpoint,
        api_endpoint: config.apiEndpoint,
        is_healthy: true,
        last_health_check_at: now,
        health_score: 100,
        replication_status: "active",
        replication_lag_seconds: 0,
        last_replicated_at: now,
        cpu_utilization: 0,
        memory_utilization: 0,
        storage_utilization: 0,
        is_primary: config.isPrimary ?? false,
        failover_priority: config.failoverPriority ?? 10,
        metadata: {},
      } as never)
      .select()
      .single();
    if (error) throw error;
    return rowToRegion(data as Record<string, unknown>);
  }

  static async performHealthCheck(
    regionId: string,
  ): Promise<{ healthy: boolean; score: number; issues: string[] }> {
    const { data } = await supabaseAdmin
      .from("dr_regions" as never)
      .select("*")
      .eq("id", regionId)
      .single();
    if (!data) return { healthy: false, score: 0, issues: ["Region not found"] };
    const region = data as Record<string, unknown>;
    const issues: string[] = [];
    let score = 100;
    const lag = Number(region.replication_lag_seconds ?? 0);
    if (lag > 300) {
      issues.push(`High replication lag: ${lag}s`);
      score -= 20;
    }
    if (Number(region.cpu_utilization ?? 0) > 90) {
      issues.push(`High CPU utilization`);
      score -= 10;
    }
    if (Number(region.memory_utilization ?? 0) > 90) {
      issues.push(`High memory utilization`);
      score -= 10;
    }
    const healthy = score >= 50 && issues.length === 0;
    await supabaseAdmin
      .from("dr_regions" as never)
      .update({
        is_healthy: healthy,
        health_score: score,
        last_health_check_at: new Date().toISOString(),
      } as never)
      .eq("id", regionId);
    return { healthy, score, issues };
  }

  static async getRegions(tenantId: string): Promise<DRRegion[]> {
    const { data } = await supabaseAdmin
      .from("dr_regions" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("failover_priority", { ascending: true });
    return (data ?? []).map((r) => rowToRegion(r as Record<string, unknown>));
  }

  static async getPrimaryRegion(tenantId: string): Promise<DRRegion | null> {
    const { data } = await supabaseAdmin
      .from("dr_regions" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_primary", true)
      .maybeSingle();
    return data ? rowToRegion(data as Record<string, unknown>) : null;
  }

  static async getBestFailoverTarget(
    tenantId: string,
    excludeRegionId?: string,
  ): Promise<DRRegion | null> {
    let query = supabaseAdmin
      .from("dr_regions" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_healthy", true)
      .eq("is_primary", false)
      .neq("status", "failed")
      .order("failover_priority", { ascending: true })
      .limit(1);
    if (excludeRegionId) query = query.neq("id", excludeRegionId);
    const { data } = await query;
    return data && data.length > 0 ? rowToRegion(data[0] as Record<string, unknown>) : null;
  }

  static async promoteToPrimary(regionId: string, tenantId: string): Promise<void> {
    await supabaseAdmin
      .from("dr_regions" as never)
      .update({ is_primary: false, status: "secondary" } as never)
      .eq("tenant_id", tenantId)
      .eq("is_primary", true);
    await supabaseAdmin
      .from("dr_regions" as never)
      .update({ is_primary: true, status: "primary" } as never)
      .eq("id", regionId);
  }

  static async updateReplicationStatus(
    regionId: string,
    status: {
      replicationLagSeconds: number;
      lastReplicatedAt: Date;
      replicationStatus: ReplicationStatusType;
    },
  ): Promise<void> {
    await supabaseAdmin
      .from("dr_regions" as never)
      .update({
        replication_lag_seconds: status.replicationLagSeconds,
        last_replicated_at: status.lastReplicatedAt.toISOString(),
        replication_status: status.replicationStatus,
      } as never)
      .eq("id", regionId);
  }
}