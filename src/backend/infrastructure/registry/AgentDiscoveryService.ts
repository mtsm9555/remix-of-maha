import { AgentRegistryStore } from "./AgentRegistryStore";
import type { AgentMetadata, DiscoveryQuery } from "./AgentRegistryTypes";
import type { Department } from "../../agents/departments/types";

export class AgentDiscoveryService {
  static async discoverBestAgent(query: DiscoveryQuery): Promise<AgentMetadata | null> {
    const candidates = await AgentRegistryStore.searchAgents(query);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => {
      if (a.status !== b.status) return a.status === "healthy" ? -1 : 1;
      if (a.currentLoad !== b.currentLoad) return a.currentLoad - b.currentLoad;
      return b.lastHeartbeat.getTime() - a.lastHeartbeat.getTime();
    });
    return candidates[0];
  }

  static async discoverAllCapableAgents(requiredTools: string[]): Promise<AgentMetadata[]> {
    return AgentRegistryStore.searchAgents({ requiredTools });
  }

  static async getDepartmentCapacity(
    department: Department,
  ): Promise<{ total: number; available: number; avgLoad: number }> {
    const agents = await AgentRegistryStore.searchAgents({ requiredDepartment: department });
    const total = agents.length;
    const available = agents.filter((a) => a.currentLoad < 0.8 && a.status === "healthy").length;
    const avgLoad = total > 0 ? agents.reduce((s, a) => s + a.currentLoad, 0) / total : 0;
    return { total, available, avgLoad };
  }

  /**
   * Ghost cleanup — mark agents whose heartbeat expired as offline.
   * Call from a cron endpoint; Workers can't run background intervals.
   */
  static async cleanupGhosts(ttlSeconds = 120): Promise<{ ghostsCleaned: number }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - ttlSeconds * 1000).toISOString();
    const { data } = await (supabaseAdmin as any)
      .from("agent_registry_persistent")
      .update({ status: "offline", updated_at: new Date().toISOString() })
      .in("status", ["healthy", "degraded"])
      .lt("last_heartbeat", cutoff)
      .select("instance_id");
    return { ghostsCleaned: (data as any[])?.length ?? 0 };
  }
}