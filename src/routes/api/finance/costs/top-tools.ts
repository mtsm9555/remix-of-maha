import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/finance/costs/top-tools")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const cutoff = new Date(Date.now() - 86_400_000).toISOString();
        const { data, error } = await supabaseAdmin
          .from("cost_attribution_rollups")
          .select("tool_name, total_cost_usd, total_executions")
          .gte("period_start", cutoff)
          .order("total_cost_usd", { ascending: false })
          .limit(10);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ topTools: data ?? [] });
      },
    },
  },
});