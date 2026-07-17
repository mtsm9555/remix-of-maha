import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/testing/$tenantId/suites")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get("type");
        let q = supabaseAdmin
          .from("test_suites")
          .select("*")
          .eq("tenant_id", params.tenantId)
          .order("updated_at", { ascending: false });
        if (type) q = q.eq("type", type);
        const { data, error } = await q;
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ suites: data || [] });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const { data, error } = await supabaseAdmin
          .from("test_suites")
          .insert({
            id: `suite_${crypto.randomUUID()}`,
            tenant_id: params.tenantId,
            name: body.name,
            description: body.description,
            type: body.type,
            tags: body.tags || [],
            test_cases: body.testCases || [],
            setup_script: body.setupScript,
            teardown_script: body.teardownScript,
            parallel_execution: body.parallelExecution ?? false,
            timeout_ms: body.timeoutMs ?? 30000,
            retry_count: body.retryCount ?? 0,
            created_by: body.createdBy || "system",
          })
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ success: true, suite: data });
      },
    },
  },
});