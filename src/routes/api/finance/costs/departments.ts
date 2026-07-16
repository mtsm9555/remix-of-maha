import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/finance/costs/departments")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const cutoff = new Date(Date.now() - 86_400_000).toISOString();
        const { data, error } = await supabaseAdmin
          .from("cost_attribution_rollups")
          .select("department, tool_name, total_cost_usd, total_executions")
          .gte("period_start", cutoff);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const departments: Record<string, { totalCost: number; executions: number }> = {};
        for (const row of (data ?? []) as Array<{
          department: string;
          total_cost_usd: number;
          total_executions: number;
        }>) {
          const d = (departments[row.department] ??= { totalCost: 0, executions: 0 });
          d.totalCost += Number(row.total_cost_usd ?? 0);
          d.executions += Number(row.total_executions ?? 0);
        }
        return Response.json({ departments });
      },
    },
  },
});