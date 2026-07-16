import type { AgentCapabilityMap, CapabilitySearchQuery } from "./CapabilityTypes";

/**
 * Supabase-backed store for agent capability maps.
 * Kept separate from AgentRegistryStore (which is the live-fleet source of truth).
 */
export class CapabilityStore {
  private static async db() {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin as any;
  }

  static async getAgentCapabilities(agentId: string): Promise<AgentCapabilityMap | null> {
    const db = await this.db();
    const { data } = await db
      .from("agent_capability_maps")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle();
    return data ? this.rowToMap(data) : null;
  }

  static async upsertAgentCapabilities(map: AgentCapabilityMap): Promise<void> {
    const db = await this.db();
    await db.from("agent_capability_maps").upsert(
      {
        agent_id: map.agentId,
        agent_type: map.agentType,
        department: map.department,
        input_modalities: map.inputModalities,
        output_modalities: map.outputModalities,
        tools: map.tools,
        primary_model: map.primaryModel,
        expertise: map.expertise,
        capability_embedding: map.capabilityEmbedding.length > 0 ? map.capabilityEmbedding : null,
        version: map.version,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "agent_id" },
    );
  }

  static async searchAgentsByCapabilities(
    query: CapabilitySearchQuery,
  ): Promise<AgentCapabilityMap[]> {
    const db = await this.db();
    let q = db.from("agent_capability_maps").select("*");
    if (query.department) q = q.eq("department", query.department);
    if (query.inputModality) q = q.contains("input_modalities", [query.inputModality]);
    if (query.requiredTool) q = q.contains("tools", [{ name: query.requiredTool }]);
    const { data } = await q;
    return ((data as any[]) ?? []).map((r) => this.rowToMap(r));
  }

  private static rowToMap(row: any): AgentCapabilityMap {
    return {
      agentId: row.agent_id,
      agentType: row.agent_type,
      department: row.department,
      inputModalities: row.input_modalities ?? [],
      outputModalities: row.output_modalities ?? [],
      maxConcurrentTasks: 3,
      tools: row.tools ?? [],
      primaryModel: row.primary_model ?? {
        provider: "",
        modelName: "",
        contextWindowTokens: 0,
        maxOutputTokens: 0,
        supportsVision: false,
        costPerInputTokenUSD: 0,
        costPerOutputTokenUSD: 0,
      },
      fallbackModels: [],
      expertise: row.expertise ?? [],
      capabilityEmbedding: Array.isArray(row.capability_embedding) ? row.capability_embedding : [],
      version: row.version ?? "1.0.0",
      lastUpdated: new Date(row.last_updated),
    };
  }
}