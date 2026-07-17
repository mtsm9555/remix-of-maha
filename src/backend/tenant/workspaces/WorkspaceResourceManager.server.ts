import type { WorkspaceResourceQuota } from "./WorkspaceTypes";

export class WorkspaceResourceManager {
  static async canAllocate(
    workspaceId: string,
    resourceType: keyof WorkspaceResourceQuota,
    amount = 1,
  ): Promise<{ allowed: boolean; current: number; limit: number; reason?: string }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ws } = await supabaseAdmin.from("workspaces" as never)
      .select("resource_quota").eq("id", workspaceId).maybeSingle();
    if (!ws) return { allowed: false, current: 0, limit: 0, reason: "Workspace not found" };
    const quota = (ws as { resource_quota: WorkspaceResourceQuota }).resource_quota;
    const limit = Number(quota[resourceType] ?? 0);
    const current = await this.getCurrentUsage(workspaceId, resourceType);
    if (current + amount > limit) {
      return { allowed: false, current, limit, reason: `Limit reached (${current}/${limit})` };
    }
    return { allowed: true, current, limit };
  }

  static async getCurrentUsage(
    workspaceId: string,
    resourceType: keyof WorkspaceResourceQuota,
  ): Promise<number> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    switch (resourceType) {
      case "monthlyBudgetUSD": {
        const start = new Date();
        start.setDate(1); start.setHours(0, 0, 0, 0);
        const { data } = await supabaseAdmin.from("workspace_budget_usage" as never)
          .select("amount_usd").eq("workspace_id", workspaceId)
          .gte("recorded_at", start.toISOString());
        return ((data ?? []) as Array<{ amount_usd: number }>)
          .reduce((s, r) => s + Number(r.amount_usd), 0);
      }
      default:
        return 0;
    }
  }

  static async recordBudgetUsage(workspaceId: string, amountUsd: number, description?: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `wbu_${crypto.randomUUID()}`;
    const { error } = await supabaseAdmin.from("workspace_budget_usage" as never).insert({
      id, workspace_id: workspaceId, amount_usd: amountUsd, description: description ?? null,
    } as never);
    if (error) throw new Error(error.message);
  }
}