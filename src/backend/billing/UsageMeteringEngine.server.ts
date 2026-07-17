import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SubscriptionUsage } from "./SubscriptionTypes";

const FIELD_MAP: Record<string, keyof SubscriptionUsage> = {
  active_agents: "activeAgents",
  team_members: "teamMembers",
  memory_records: "memoryRecords",
  storage_gb: "storageUsedGB",
  api_calls: "apiCallsThisMonth",
};

export class UsageMeteringEngine {
  static async recordUsage(tenantId: string, metricName: string, value = 1): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await supabaseAdmin.from("usage_meters").insert({
      tenant_id: tenantId,
      metric_name: metricName,
      value,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    });

    const field = FIELD_MAP[metricName];
    if (field) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions").select("id, usage").eq("tenant_id", tenantId).maybeSingle();
      if (sub) {
        const usage = { ...((sub as any).usage ?? {}) };
        usage[field] = (usage[field] ?? 0) + value;
        await supabaseAdmin.from("subscriptions")
          .update({ usage: usage as any }).eq("id", (sub as any).id);
      }
    }
  }

  static async getCurrentPeriodUsage(tenantId: string, metricName: string): Promise<number> {
    const periodStart = new Date();
    periodStart.setDate(1); periodStart.setHours(0, 0, 0, 0);
    const { data } = await supabaseAdmin
      .from("usage_meters").select("value")
      .eq("tenant_id", tenantId).eq("metric_name", metricName)
      .gte("recorded_at", periodStart.toISOString());
    return (data ?? []).reduce((sum, r: any) => sum + Number(r.value), 0);
  }

  static async getUsageBreakdown(tenantId: string): Promise<Record<string, number>> {
    const periodStart = new Date();
    periodStart.setDate(1); periodStart.setHours(0, 0, 0, 0);
    const { data } = await supabaseAdmin
      .from("usage_meters").select("metric_name, value")
      .eq("tenant_id", tenantId).gte("recorded_at", periodStart.toISOString());
    const out: Record<string, number> = {};
    for (const r of (data ?? []) as any[]) {
      out[r.metric_name] = (out[r.metric_name] ?? 0) + Number(r.value);
    }
    return out;
  }

  static async resetMonthlyUsage(): Promise<void> {
    const empty = {
      activeAgents: 0, teamMembers: 0, memoryRecords: 0, storageUsedGB: 0, apiCallsThisMonth: 0,
    };
    await supabaseAdmin.from("subscriptions").update({ usage: empty as any }).not("id", "is", null);
  }
}