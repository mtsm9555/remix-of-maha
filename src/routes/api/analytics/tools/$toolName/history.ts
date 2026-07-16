import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/tools/$toolName/history")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const hours = Number(url.searchParams.get("hours") || 24);
        const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
        const { data, error } = await supabaseAdmin
          .from("tool_metric_rollups")
          .select("period_start, total_executions, success_rate, p95_latency_ms, total_cost_usd")
          .eq("tool_name", params.toolName)
          .gte("period_start", cutoff)
          .order("period_start", { ascending: true });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ toolName: params.toolName, history: data ?? [] });
      },
    },
  },
});