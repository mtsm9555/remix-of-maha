import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { DeploymentManager } from "@/backend/cicd/DeploymentManager.server";

export const Route = createFileRoute("/api/cicd/$tenantId/deployments")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const environmentId = url.searchParams.get("environmentId");
        let q = supabaseAdmin
          .from("deployments")
          .select("*")
          .eq("tenant_id", params.tenantId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (environmentId) q = q.eq("environment_id", environmentId);
        const { data, error } = await q;
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ deployments: data ?? [] });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const deployment = await DeploymentManager.deploy(
          body.environmentId,
          body.runId,
          params.tenantId,
          body.deployedBy ?? "system",
          body.approvedBy,
        );
        return Response.json({ success: true, deployment });
      },
    },
  },
});