import type { AgentProfile } from "./DiscoveryTypes";

export class ReputationScorer {
  static async calculateTrustScore(
    agentId: string,
  ): Promise<{ trustScore: number; totalTasks: number; overrideRate: number }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("agent_performance_metrics")
      .select("success_rate, average_qa_score, human_override_rate, total_tasks")
      .eq("agent_id", agentId)
      .maybeSingle();

    if (!data) return { trustScore: 0.5, totalTasks: 0, overrideRate: 0 };

    const successComponent = data.success_rate * 0.4;
    const qaComponent = data.average_qa_score * 0.4;
    const overrideComponent = (1 - data.human_override_rate) * 0.2;
    const trustScore = Math.min(1.0, successComponent + qaComponent + overrideComponent);

    return {
      trustScore,
      totalTasks: data.total_tasks,
      overrideRate: data.human_override_rate,
    };
  }

  static async enrichProfileWithReputation(profile: AgentProfile): Promise<AgentProfile> {
    const metrics = await this.calculateTrustScore(profile.agentType);
    return {
      ...profile,
      trustScore: metrics.trustScore,
      totalTasksCompleted: metrics.totalTasks,
      humanOverrideRate: metrics.overrideRate,
    };
  }
}