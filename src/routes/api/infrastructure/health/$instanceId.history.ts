import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/health/$instanceId/history")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const hours = Number(url.searchParams.get("hours") ?? 24);
        const cutoff = new Date(Date.now() - hours * 3600000).toISOString();
        const { data } = await supabaseAdmin
          .from("agent_health_metrics")
          .select("recorded_at, cpu_usage, memory_usage_mb, llm_latency_ms, llm_error_rate")
          .eq("instance_id", params.instanceId)
          .gte("recorded_at", cutoff)
          .order("recorded_at", { ascending: true });
        return Response.json({ metrics: data ?? [] });
      },
    },
  },
});