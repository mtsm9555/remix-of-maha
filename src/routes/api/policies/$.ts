import { createFileRoute } from "@tanstack/react-router";
import { PolicyStore } from "@/backend/os/policy/PolicyStore";
import { PolicyGateway } from "@/backend/os/policy/PolicyGateway";

export const Route = createFileRoute("/api/policies/$")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("enterprise_policies")
          .select("*")
          .order("priority", { ascending: false });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return Response.json({ policies: data });
      },
      POST: async ({ request, params }) => {
        const splat = (params as any)._splat ?? "";
        const body = await request.json();

        if (splat === "test") {
          const allowed = await PolicyGateway.evaluateAndEnforce(body);
          return Response.json({ allowed });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("enterprise_policies").upsert(body);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        PolicyStore.invalidateCache();
        return Response.json({ success: true });
      },
    },
  },
});