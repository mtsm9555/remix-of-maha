import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/testing/$tenantId/runs/$runId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { data, error } = await supabaseAdmin
          .from("test_runs")
          .select("*")
          .eq("id", params.runId)
          .eq("tenant_id", params.tenantId)
          .single();
        if (error || !data) return Response.json({ error: "Run not found" }, { status: 404 });
        return Response.json({ run: data });
      },
    },
  },
});