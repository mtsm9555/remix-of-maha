import type { AgentPerformanceMetrics, PromptVersion } from "./LearningTypes";

export class PromptVersionControl {
  static async deployCanaryVersion(
    agentId: string,
    newPrompt: string,
    fewShots: string[],
    metrics: AgentPerformanceMetrics,
  ): Promise<PromptVersion> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const latest = await this.getLatestStableVersion(agentId);
    const versionNumber = latest ? latest.versionNumber + 1 : 1;

    const { data, error } = await (supabaseAdmin as any)
      .from("agent_prompt_versions")
      .insert({
        agent_id: agentId,
        version_number: versionNumber,
        system_prompt: newPrompt,
        few_shot_examples: fewShots,
        status: "canary",
        performance_metrics: metrics,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return this.rowToVersion(data);
  }

  static async promoteToStable(agentId: string, versionId: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("agent_prompt_versions")
      .update({ status: "archived", replaced_at: new Date().toISOString() })
      .eq("agent_id", agentId)
      .eq("status", "stable");
    await (supabaseAdmin as any)
      .from("agent_prompt_versions")
      .update({ status: "stable" })
      .eq("id", versionId);
  }

  static async rollbackToPreviousStable(agentId: string, canaryVersionId: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("agent_prompt_versions")
      .update({ status: "archived" })
      .eq("id", canaryVersionId);

    const { data } = await (supabaseAdmin as any)
      .from("agent_prompt_versions")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "archived")
      .order("version_number", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      await (supabaseAdmin as any)
        .from("agent_prompt_versions")
        .update({ status: "stable" })
        .eq("id", data[0].id);
    }
  }

  static async getLatestStableVersion(agentId: string): Promise<PromptVersion | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("agent_prompt_versions")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "stable")
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? this.rowToVersion(data) : null;
  }

  private static rowToVersion(row: any): PromptVersion {
    return {
      id: row.id,
      agentId: row.agent_id,
      versionNumber: row.version_number,
      systemPrompt: row.system_prompt,
      fewShotExamples: row.few_shot_examples ?? [],
      status: row.status,
      performanceMetrics: row.performance_metrics,
      createdAt: new Date(row.created_at),
      replacedAt: row.replaced_at ? new Date(row.replaced_at) : undefined,
    };
  }
}