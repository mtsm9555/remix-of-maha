import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/discovery/reputation/$agentId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await (supabaseAdmin as any)
          .from("agent_performance_metrics")
          .select("*")
          .eq("agent_id", params.agentId)
          .maybeSingle();
        return Response.json({ agentId: params.agentId, metrics: data ?? null });
      },
    },
  },
});