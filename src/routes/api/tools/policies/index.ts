import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/policies/")({
  server: {
    handlers: {
      GET: async () => {
        const { ToolPolicyStore } = await import(
          "@/backend/tools/policy/ToolPolicyStore.server"
        );
        const policies = await ToolPolicyStore.getActivePolicies();
        return Response.json({ policies });
      },
      POST: async ({ request }) => {
        const policy = (await request.json()) as Record<string, unknown>;
        if (!policy?.id) {
          return Response.json({ error: "id required" }, { status: 400 });
        }
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { error } = await supabaseAdmin
          .from("tool_policies")
          .upsert(policy as never, { onConflict: "id" });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        const { ToolPolicyStore } = await import(
          "@/backend/tools/policy/ToolPolicyStore.server"
        );
        ToolPolicyStore.invalidateCache();
        return Response.json({ success: true });
      },
    },
  },
});