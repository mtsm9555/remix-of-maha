import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/scaling/policies/$policyId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("scaling_policies")
          .select("*")
          .eq("id", params.policyId)
          .maybeSingle();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        if (!data) return Response.json({ error: "not_found" }, { status: 404 });
        return Response.json({ policy: data });
      },
      PATCH: async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
        const map: Record<string, string> = {
          name: "name",
          description: "description",
          minInstances: "min_instances",
          maxInstances: "max_instances",
          triggers: "triggers",
          triggerConfigs: "trigger_configs",
          status: "status",
          scaleUpCooldownSeconds: "scale_up_cooldown_seconds",
          scaleDownCooldownSeconds: "scale_down_cooldown_seconds",
        };
        for (const [k, v] of Object.entries(body)) if (map[k] !== undefined) update[map[k]] = v;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("scaling_policies")
          .update(update)
          .eq("id", params.policyId)
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ policy: data });
      },
      DELETE: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("scaling_policies").delete().eq("id", params.policyId);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ success: true });
      },
    },
  },
});