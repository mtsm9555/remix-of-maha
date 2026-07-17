import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/cicd/$tenantId/runs")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const pipelineId = url.searchParams.get("pipelineId");
        const limit = Number(url.searchParams.get("limit") ?? 50);
        let q = supabaseAdmin
          .from("pipeline_runs")
          .select("*")
          .eq("tenant_id", params.tenantId)
          .order("started_at", { ascending: false })
          .limit(limit);
        if (pipelineId) q = q.eq("pipeline_id", pipelineId);
        const { data, error } = await q;
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ runs: data ?? [] });
      },
    },
  },
});