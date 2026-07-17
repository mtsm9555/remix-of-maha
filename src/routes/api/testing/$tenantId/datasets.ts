import { createFileRoute } from "@tanstack/react-router";
import { AgentEvaluator } from "@/backend/testing/AgentEvaluator.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/testing/$tenantId/datasets")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { data, error } = await supabaseAdmin
          .from("golden_datasets")
          .select("*")
          .eq("tenant_id", params.tenantId)
          .order("updated_at", { ascending: false });
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ datasets: data || [] });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const dataset = await AgentEvaluator.createDataset(params.tenantId, body);
        return Response.json({ success: true, dataset });
      },
    },
  },
});