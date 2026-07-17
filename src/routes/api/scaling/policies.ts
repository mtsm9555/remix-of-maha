import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/scaling/policies")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("scaling_policies")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ policies: data ?? [] });
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as any;
        if (!body?.name || !body?.targetResourceType || !body?.targetResourceId || !body?.cloudProvider) {
          return Response.json({ error: "name, targetResourceType, targetResourceId, cloudProvider required" }, { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const id = `policy_${crypto.randomUUID()}`;
        const { data, error } = await supabaseAdmin
          .from("scaling_policies")
          .insert({
            id,
            name: body.name,
            description: body.description ?? null,
            target_resource_type: body.targetResourceType,
            target_resource_id: body.targetResourceId,
            min_instances: body.minInstances ?? 1,
            max_instances: body.maxInstances ?? 10,
            current_instances: body.currentInstances ?? 1,
            desired_instances: body.desiredInstances ?? body.currentInstances ?? 1,
            triggers: body.triggers ?? [],
            trigger_configs: body.triggerConfigs ?? {},
            scale_up_cooldown_seconds: body.scaleUpCooldownSeconds ?? 300,
            scale_down_cooldown_seconds: body.scaleDownCooldownSeconds ?? 600,
            stabilization_window_seconds: body.stabilizationWindowSeconds ?? 300,
            status: body.status ?? "active",
            cloud_provider: body.cloudProvider,
          })
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ policy: data });
      },
    },
  },
});