import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/reputation/$agentId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const agentId = params.agentId;
        const [{ data: score }, { data: metrics }, { data: recentEvents }] = await Promise.all([
          supabaseAdmin.from("agent_reputation_scores").select("*").eq("agent_id", agentId).maybeSingle(),
          supabaseAdmin.from("agent_reputation_metrics").select("*").eq("agent_id", agentId).maybeSingle(),
          supabaseAdmin.from("reputation_events").select("*").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(10),
        ]);
        return Response.json({ score, metrics, recentEvents: recentEvents ?? [] });
      },
    },
  },
});