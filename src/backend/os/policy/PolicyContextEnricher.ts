import type { PolicyContext } from "./PolicyTypes";

export class PolicyContextEnricher {
  static async enrichContext(baseContext: Partial<PolicyContext>): Promise<PolicyContext> {
    const agentReputation = await this.getAgentReputation(baseContext.agentId ?? "unknown");
    return {
      agentId: baseContext.agentId ?? "unknown",
      agentReputationScore: agentReputation,
      department: baseContext.department ?? "unknown",
      actionType: baseContext.actionType ?? "execute",
      toolName: baseContext.toolName,
      payload: baseContext.payload ?? {},
      timestamp: new Date(),
      estimatedCostUSD: baseContext.estimatedCostUSD ?? 0,
    };
  }

  private static async getAgentReputation(agentId: string): Promise<number> {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("agent_reputation_scores")
        .select("score")
        .eq("agent_id", agentId)
        .maybeSingle();
      return (data as any)?.score ?? 0.5;
    } catch {
      return 0.5;
    }
  }
}