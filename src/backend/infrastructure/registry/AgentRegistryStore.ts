import type {
  AgentMetadata,
  AgentRegistryStatus,
  DiscoveryQuery,
} from "./AgentRegistryTypes";
import { HEARTBEAT_TTL_SECONDS } from "./AgentRegistryTypes";

/**
 * Supabase-backed registry (no Redis on Cloudflare Workers).
 * Liveness is derived from `last_heartbeat` vs HEARTBEAT_TTL_SECONDS.
 */
export class AgentRegistryStore {
  private static async db() {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin as any;
  }

  static async registerAgent(metadata: AgentMetadata): Promise<void> {
    const db = await this.db();
    await db.from("agent_registry_persistent").upsert(
      {
        instance_id: metadata.instanceId,
        agent_type: metadata.agentType,
        department: metadata.department,
        network_host: metadata.network.host,
        network_port: metadata.network.port,
        network_protocol: metadata.network.protocol,
        execution_endpoint: metadata.network.executionEndpoint,
        capabilities: metadata.capabilities,
        current_load: metadata.currentLoad,
        max_concurrent_tasks: metadata.maxConcurrentTasks,
        status: "healthy",
        last_heartbeat: new Date().toISOString(),
        registered_at: metadata.registeredAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "instance_id" },
    );
  }

  static async deregisterAgent(instanceId: string): Promise<void> {
    const db = await this.db();
    await db
      .from("agent_registry_persistent")
      .update({ status: "offline", updated_at: new Date().toISOString() })
      .eq("instance_id", instanceId);
  }

  static async updateHeartbeat(instanceId: string, currentLoad: number): Promise<void> {
    const db = await this.db();
    const status: AgentRegistryStatus = currentLoad > 0.9 ? "degraded" : "healthy";
    await db
      .from("agent_registry_persistent")
      .update({
        current_load: currentLoad,
        status,
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("instance_id", instanceId);
  }

  static async getAgent(instanceId: string): Promise<AgentMetadata | null> {
    const db = await this.db();
    const { data } = await db
      .from("agent_registry_persistent")
      .select("*")
      .eq("instance_id", instanceId)
      .maybeSingle();
    return data ? this.rowToMetadata(data) : null;
  }

  static async searchAgents(query: DiscoveryQuery): Promise<AgentMetadata[]> {
    const db = await this.db();
    let q = db
      .from("agent_registry_persistent")
      .select("*")
      .in("status", ["healthy", "degraded"]);
    if (query.requiredDepartment) q = q.eq("department", query.requiredDepartment);
    if (query.maxLoadThreshold !== undefined) q = q.lte("current_load", query.maxLoadThreshold);
    const { data } = await q;
    if (!data) return [];

    const cutoff = Date.now() - HEARTBEAT_TTL_SECONDS * 1000;
    return (data as any[])
      .map((r) => this.rowToMetadata(r))
      .filter((a) => a.lastHeartbeat.getTime() >= cutoff)
      .filter((a) => {
        if (query.requiredTools && !query.requiredTools.every((t) => a.capabilities.tools.includes(t)))
          return false;
        if (query.requiredModel && !a.capabilities.models.includes(query.requiredModel)) return false;
        return true;
      });
  }

  private static rowToMetadata(row: any): AgentMetadata {
    const caps = (row.capabilities ?? {}) as Partial<AgentMetadata["capabilities"]>;
    return {
      instanceId: row.instance_id,
      agentType: row.agent_type,
      department: row.department,
      network: {
        host: row.network_host,
        port: row.network_port,
        protocol: (row.network_protocol ?? "http") as "http" | "grpc",
        executionEndpoint: row.execution_endpoint ?? "/api/v1/execute",
      },
      capabilities: {
        tools: caps.tools ?? [],
        models: caps.models ?? [],
        languages: caps.languages ?? [],
        maxContextTokens: caps.maxContextTokens ?? 0,
      },
      currentLoad: Number(row.current_load ?? 0),
      maxConcurrentTasks: row.max_concurrent_tasks ?? 1,
      registeredAt: new Date(row.registered_at),
      lastHeartbeat: new Date(row.last_heartbeat),
      status: row.status,
    };
  }
}