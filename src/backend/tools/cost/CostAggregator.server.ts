export class CostAggregator {
  static async generateHourlyDepartmentRollups(): Promise<number> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const periodStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000 - 3_600_000);
    const since = periodStart.toISOString();
    const until = new Date(periodStart.getTime() + 3_600_000).toISOString();

    const { data: events, error } = await supabaseAdmin
      .from("tool_cost_events")
      .select("department, tool_name, total_cost_usd")
      .gte("timestamp", since)
      .lt("timestamp", until);
    if (error) throw new Error(error.message);
    if (!events || events.length === 0) return 0;

    const grouped = new Map<string, { department: string; tool_name: string; cost: number; count: number }>();
    for (const e of events as Array<{ department: string; tool_name: string; total_cost_usd: number }>) {
      const key = `${e.department}|${e.tool_name}`;
      const bucket = grouped.get(key) ?? { department: e.department, tool_name: e.tool_name, cost: 0, count: 0 };
      bucket.cost += Number(e.total_cost_usd ?? 0);
      bucket.count++;
      grouped.set(key, bucket);
    }

    const rows = Array.from(grouped.values()).map((g) => ({
      department: g.department,
      tool_name: g.tool_name,
      period_start: since,
      total_cost_usd: g.cost,
      total_executions: g.count,
    }));

    const { error: upErr } = await supabaseAdmin
      .from("cost_attribution_rollups")
      .upsert(rows as never, { onConflict: "department,tool_name,period_start" });
    if (upErr) throw new Error(upErr.message);
    return rows.length;
  }
}