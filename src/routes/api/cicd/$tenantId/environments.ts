import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/cicd/$tenantId/environments")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { data, error } = await supabaseAdmin
          .from("environments")
          .select("*")
          .eq("tenant_id", params.tenantId)
          .order("created_at", { ascending: false });
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ environments: data ?? [] });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const { data, error } = await supabaseAdmin
          .from("environments")
          .insert({
            id: `env_${crypto.randomUUID()}`,
            tenant_id: params.tenantId,
            name: body.name,
            type: body.type ?? "development",
            description: body.description,
            url: body.url,
            variables: body.variables ?? {},
            secrets: body.secrets ?? [],
            deployment_strategy: body.deploymentStrategy ?? "rolling",
            auto_deploy_on_success: body.autoDeployOnSuccess ?? false,
            require_approval: body.requireApproval ?? false,
            approvers: body.approvers ?? [],
            is_protected: body.isProtected ?? false,
            allowed_branches: body.allowedBranches ?? [],
          })
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ success: true, environment: data });
      },
    },
  },
});