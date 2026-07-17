import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PipelineParser } from "@/backend/cicd/PipelineParser";

export const Route = createFileRoute("/api/cicd/$tenantId/pipelines")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { data, error } = await supabaseAdmin
          .from("pipelines")
          .select("*")
          .eq("tenant_id", params.tenantId)
          .order("updated_at", { ascending: false });
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ pipelines: data ?? [] });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const definition =
          typeof body.definitionYaml === "string"
            ? PipelineParser.parse(body.definitionYaml)
            : body.definition;
        const { data, error } = await supabaseAdmin
          .from("pipelines")
          .insert({
            id: `pipeline_${crypto.randomUUID()}`,
            tenant_id: params.tenantId,
            name: body.name,
            description: body.description,
            repository_url: body.repositoryUrl,
            branch: body.branch ?? "main",
            definition,
            variables: body.variables ?? {},
            secrets: body.secrets ?? [],
            triggers: body.triggers ?? [],
            timeout_minutes: body.timeoutMinutes ?? 60,
            concurrency_limit: body.concurrencyLimit ?? 1,
            auto_cancel_on_new_push: body.autoCancelOnNewPush ?? false,
            created_by: body.createdBy ?? "system",
          })
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ success: true, pipeline: data });
      },
    },
  },
});