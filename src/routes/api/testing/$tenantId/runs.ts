import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/testing/$tenantId/runs")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const suiteId = url.searchParams.get("suiteId");
        const limit = Number(url.searchParams.get("limit") || 50);
        let q = supabaseAdmin
          .from("test_runs")
          .select("*")
          .eq("tenant_id", params.tenantId)
          .order("started_at", { ascending: false })
          .limit(limit);
        if (suiteId) q = q.eq("suite_id", suiteId);
        const { data, error } = await q;
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ runs: data || [] });
      },
    },
  },
});