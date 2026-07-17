import type { TeamResourceQuota } from "./AdvancedTeamTypes";

export class TeamResourceManager {
  static async canSpawnAgent(teamId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: team } = await supabaseAdmin
      .from("organization_teams" as never)
      .select("resource_quota")
      .eq("id", teamId)
      .single();
    if (!team) return { allowed: false, reason: "Team not found" };
    const quota = (team as { resource_quota: TeamResourceQuota }).resource_quota;
    const { count } = await supabaseAdmin
      .from("agent_instances_registry" as never)
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("status", "active");
    if (count && count >= quota.maxAgents) {
      return { allowed: false, reason: `Team has reached maximum agent quota (${quota.maxAgents})` };
    }
    return { allowed: true };
  }

  static async trackBudgetUsage(
    teamId: string,
    amountUSD: number,
    resourceType?: string,
  ): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("team_budget_usage" as never).insert({
      team_id: teamId,
      amount_usd: amountUSD,
      resource_type: resourceType ?? null,
    } as never);
  }

  static async getCurrentMonthBudgetUsage(
    teamId: string,
  ): Promise<{ used: number; limit: number; percentage: number }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: team } = await supabaseAdmin
      .from("organization_teams" as never)
      .select("resource_quota")
      .eq("id", teamId)
      .single();
    if (!team) return { used: 0, limit: 0, percentage: 0 };
    const quota = (team as { resource_quota: TeamResourceQuota }).resource_quota;
    const limit = quota.monthlyBudgetUSD;
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const { data: usage } = await supabaseAdmin
      .from("team_budget_usage" as never)
      .select("amount_usd")
      .eq("team_id", teamId)
      .gte("recorded_at", start.toISOString());
    const used = (usage ?? []).reduce(
      (sum, r) => sum + ((r as { amount_usd: number }).amount_usd ?? 0),
      0,
    );
    const percentage = limit > 0 ? (used / limit) * 100 : 0;
    return { used, limit, percentage };
  }

  static async canUseTool(teamId: string, toolName: string): Promise<boolean> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: team } = await supabaseAdmin
      .from("organization_teams" as never)
      .select("resource_quota")
      .eq("id", teamId)
      .single();
    if (!team) return false;
    const quota = (team as { resource_quota: TeamResourceQuota }).resource_quota;
    if (quota.allowedTools.includes("*")) return true;
    return quota.allowedTools.includes(toolName);
  }

  static async updateQuota(
    teamId: string,
    newQuota: Partial<TeamResourceQuota>,
  ): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: team } = await supabaseAdmin
      .from("organization_teams" as never)
      .select("resource_quota")
      .eq("id", teamId)
      .single();
    if (!team) throw new Error("Team not found");
    const current = (team as { resource_quota: TeamResourceQuota }).resource_quota;
    const updated = { ...current, ...newQuota };
    await supabaseAdmin
      .from("organization_teams" as never)
      .update({ resource_quota: updated, updated_at: new Date().toISOString() } as never)
      .eq("id", teamId);
  }
}