import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/tools/overview")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const cutoff = new Date(Date.now() - 86_400_000).toISOString();
        const { data: rollups, error } = await supabaseAdmin
          .from("tool_metric_rollups")
          .select("tool_name, total_executions, success_rate, avg_latency_ms, total_cost_usd")
          .gte("period_start", cutoff)
          .order("total_executions", { ascending: false });
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const acc: Record<string, { executions: number; cost: number; latencySum: number; successSum: number; count: number }> = {};
        for (const r of rollups ?? []) {
          const key = r.tool_name as string;
          const cur = (acc[key] ||= { executions: 0, cost: 0, latencySum: 0, successSum: 0, count: 0 });
          cur.executions += r.total_executions as number;
          cur.cost += r.total_cost_usd as number;
          cur.latencySum += r.avg_latency_ms as number;
          cur.successSum += r.success_rate as number;
          cur.count++;
        }
        const tools = Object.entries(acc).map(([toolName, d]) => ({
          toolName,
          totalExecutions: d.executions,
          totalCostUSD: d.cost,
          avgLatencyMs: d.count ? d.latencySum / d.count : 0,
          avgSuccessRate: d.count ? d.successSum / d.count : 0,
        }));
        return Response.json({ tools });
      },
    },
  },
});