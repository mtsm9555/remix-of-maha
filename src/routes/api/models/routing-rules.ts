import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models/routing-rules")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tenantId = url.searchParams.get("tenantId");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let q = supabaseAdmin.from("model_routing_rules").select("*").order("priority", { ascending: false });
        if (tenantId) q = q.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
        const { data, error } = await q;
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ rules: data ?? [] });
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as any;
        if (!body?.name || !body?.primaryModelId) {
          return Response.json({ error: "name and primaryModelId required" }, { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const id = `rule_${crypto.randomUUID()}`;
        const { data, error } = await supabaseAdmin
          .from("model_routing_rules")
          .insert({
            id,
            name: body.name,
            description: body.description ?? null,
            conditions: body.conditions ?? [],
            logic: body.logic ?? "AND",
            primary_model_id: body.primaryModelId,
            fallback_model_ids: body.fallbackModelIds ?? [],
            fallback_strategy: body.fallbackStrategy ?? "sequential",
            max_cost_per_request_usd: body.maxCostPerRequestUSD ?? null,
            max_latency_ms: body.maxLatencyMs ?? null,
            min_confidence_score: body.minConfidenceScore ?? null,
            priority: body.priority ?? 0,
            is_active: body.isActive ?? true,
            tenant_id: body.tenantId ?? null,
          })
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ rule: data });
      },
    },
  },
});