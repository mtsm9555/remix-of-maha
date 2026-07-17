import type { TeamPerformanceMetrics, TeamResourceQuota } from "./AdvancedTeamTypes";

export class TeamAnalyticsEngine {
  static async generateTeamMetrics(
    teamId: string,
    period: string,
  ): Promise<TeamPerformanceMetrics> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [start, end] = this.parsePeriod(period);

    const { data: members } = await supabaseAdmin
      .from("organization_members" as never)
      .select("user_id")
      .contains("team_ids", [teamId]);
    const memberIds = ((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id);

    const { data: budgetUsage } = await supabaseAdmin
      .from("team_budget_usage" as never)
      .select("amount_usd")
      .eq("team_id", teamId)
      .gte("recorded_at", start.toISOString())
      .lte("recorded_at", end.toISOString());
    const totalBudgetUsed = ((budgetUsage ?? []) as Array<{ amount_usd: number }>).reduce(
      (s, r) => s + (r.amount_usd ?? 0), 0,
    );

    const { data: team } = await supabaseAdmin
      .from("organization_teams" as never)
      .select("resource_quota")
      .eq("id", teamId)
      .single();
    const budgetLimit = ((team as { resource_quota?: TeamResourceQuota } | null)?.resource_quota?.monthlyBudgetUSD) ?? 0;
    const budgetUtilization = budgetLimit > 0 ? totalBudgetUsed / budgetLimit : 0;

    return {
      teamId,
      period,
      totalTasksCompleted: 0,
      averageTaskDuration: 0,
      budgetUtilization,
      agentSuccessRate: 0,
      memberContribution: memberIds.map((memberId) => ({
        memberId, tasksCompleted: 0, hoursLogged: 0,
      })),
    };
  }

  static async getDashboardData(teamId: string): Promise<{
    metrics: TeamPerformanceMetrics;
    recentActivity: unknown[];
    budgetUsage: unknown[];
  }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const currentMonth = new Date().toISOString().substring(0, 7);
    const metrics = await this.generateTeamMetrics(teamId, currentMonth);
    const { data: channels } = await supabaseAdmin
      .from("team_channels" as never)
      .select("id")
      .eq("team_id", teamId);
    const channelIds = ((channels ?? []) as Array<{ id: string }>).map((c) => c.id);
    let recentActivity: unknown[] = [];
    if (channelIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("team_messages" as never)
        .select("*")
        .in("channel_id", channelIds)
        .order("created_at", { ascending: false })
        .limit(10);
      recentActivity = data ?? [];
    }
    const { data: budget } = await supabaseAdmin
      .from("team_budget_usage" as never)
      .select("amount_usd, resource_type, recorded_at")
      .eq("team_id", teamId)
      .gte("recorded_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("recorded_at", { ascending: false });
    return { metrics, recentActivity, budgetUsage: budget ?? [] };
  }

  private static parsePeriod(period: string): [Date, Date] {
    const [year, month] = period.split("-").map(Number);
    return [new Date(year, month - 1, 1), new Date(year, month, 0, 23, 59, 59)];
  }
}