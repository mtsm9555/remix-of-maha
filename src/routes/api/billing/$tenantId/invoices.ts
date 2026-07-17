import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing/$tenantId/invoices")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.from("billing_invoices").select("*")
          .eq("tenant_id", params.tenantId).order("created_at", { ascending: false }).limit(50);
        return Response.json({ invoices: data ?? [] });
      },
    },
  },
});