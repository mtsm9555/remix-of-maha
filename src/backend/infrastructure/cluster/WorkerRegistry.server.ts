import type { WorkerNode, WorkerStatus, WorkerHealthCheck } from "./ClusterTypes";

type WorkerRow = {
  id: string; hostname: string; ip_address: string; region: string; zone: string;
  capabilities: string[]; max_concurrent_tasks: number; current_task_count: number;
  cpu_cores: number; memory_gb: number; disk_gb: number; status: WorkerStatus;
  load_average: number; cpu_usage: number; memory_usage: number; version: string;
  started_at: string; last_heartbeat_at: string; metadata: Record<string, unknown> | null;
};

function mapWorker(r: WorkerRow): WorkerNode {
  return {
    id: r.id, hostname: r.hostname, ipAddress: r.ip_address, region: r.region, zone: r.zone,
    capabilities: r.capabilities ?? [], maxConcurrentTasks: r.max_concurrent_tasks,
    currentTaskCount: r.current_task_count, cpuCores: r.cpu_cores, memoryGB: r.memory_gb,
    diskGB: r.disk_gb, status: r.status, loadAverage: r.load_average, cpuUsage: r.cpu_usage,
    memoryUsage: r.memory_usage, version: r.version,
    startedAt: new Date(r.started_at), lastHeartbeatAt: new Date(r.last_heartbeat_at),
    metadata: r.metadata ?? {},
  };
}

export class WorkerRegistry {
  static async registerWorker(input: {
    hostname: string; ipAddress: string; region: string; zone: string;
    capabilities: string[]; maxConcurrentTasks?: number;
    cpuCores?: number; memoryGB?: number; diskGB?: number; version?: string;
    metadata?: Record<string, unknown>;
  }): Promise<WorkerNode> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `worker_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("worker_nodes" as never).insert({
      id, hostname: input.hostname, ip_address: input.ipAddress,
      region: input.region, zone: input.zone, capabilities: input.capabilities,
      max_concurrent_tasks: input.maxConcurrentTasks ?? 10,
      current_task_count: 0,
      cpu_cores: input.cpuCores ?? 1, memory_gb: input.memoryGB ?? 1, disk_gb: input.diskGB ?? 10,
      status: "initializing", load_average: 0, cpu_usage: 0, memory_usage: 0,
      version: input.version ?? "1.0.0", started_at: now, last_heartbeat_at: now,
      metadata: input.metadata ?? {},
    } as never).select().single();
    if (error) throw new Error(error.message);
    return mapWorker(data as unknown as WorkerRow);
  }

  static async heartbeat(workerId: string, health: {
    cpuUsage: number; memoryUsage: number; diskUsage: number;
    networkLatencyMs?: number; activeTasks?: number; errors?: string[];
  }): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const errors = health.errors ?? [];
    const status: WorkerStatus = errors.length > 0 ? "failed"
      : (health.activeTasks ?? 0) > 0 ? "busy" : "idle";
    await supabaseAdmin.from("worker_nodes" as never).update({
      status,
      cpu_usage: health.cpuUsage, memory_usage: health.memoryUsage,
      load_average: (health.cpuUsage + health.memoryUsage) / 2,
      current_task_count: health.activeTasks ?? 0,
      last_heartbeat_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never).eq("id", workerId);
    const hcId = `hc_${crypto.randomUUID()}`;
    await supabaseAdmin.from("worker_health_checks" as never).insert({
      id: hcId, worker_id: workerId,
      cpu_usage: health.cpuUsage, memory_usage: health.memoryUsage, disk_usage: health.diskUsage,
      network_latency_ms: health.networkLatencyMs ?? 0,
      active_tasks: health.activeTasks ?? 0, errors,
    } as never);
  }

  static async setStatus(workerId: string, status: WorkerStatus): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("worker_nodes" as never)
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq("id", workerId);
  }

  static async deregister(workerId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("worker_nodes" as never)
      .update({ status: "offline", updated_at: new Date().toISOString() } as never)
      .eq("id", workerId);
  }

  static async getWorker(workerId: string): Promise<WorkerNode | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("worker_nodes" as never)
      .select("*").eq("id", workerId).maybeSingle();
    return data ? mapWorker(data as unknown as WorkerRow) : null;
  }

  static async getActiveWorkers(): Promise<WorkerNode[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("worker_nodes" as never)
      .select("*").in("status", ["idle", "busy", "initializing"])
      .order("last_heartbeat_at", { ascending: false });
    return ((data ?? []) as unknown as WorkerRow[]).map(mapWorker);
  }

  static async getHealthChecks(workerId: string, limit = 50): Promise<WorkerHealthCheck[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("worker_health_checks" as never)
      .select("*").eq("worker_id", workerId)
      .order("timestamp", { ascending: false }).limit(limit);
    return ((data ?? []) as unknown as Array<{
      worker_id: string; timestamp: string; cpu_usage: number; memory_usage: number;
      disk_usage: number; network_latency_ms: number; active_tasks: number; errors: string[] | null;
    }>).map((r) => ({
      workerId: r.worker_id, timestamp: new Date(r.timestamp),
      cpuUsage: r.cpu_usage, memoryUsage: r.memory_usage, diskUsage: r.disk_usage,
      networkLatencyMs: r.network_latency_ms, activeTasks: r.active_tasks,
      errors: r.errors ?? [],
    }));
  }

  /** Mark workers with stale heartbeats as offline. */
  static async reapStaleWorkers(staleAfterMs = 90_000): Promise<number> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - staleAfterMs).toISOString();
    const { data } = await supabaseAdmin.from("worker_nodes" as never)
      .update({ status: "offline", updated_at: new Date().toISOString() } as never)
      .lt("last_heartbeat_at", cutoff)
      .in("status", ["idle", "busy", "initializing"])
      .select("id");
    return (data ?? []).length;
  }
}

export { mapWorker };
export type { WorkerRow };