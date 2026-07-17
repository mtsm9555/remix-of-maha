import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/apikeys/$tenantId/$keyId/audit")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.from("api_key_audit_logs").select("*")
          .eq("api_key_id", params.keyId).eq("tenant_id", params.tenantId)
          .order("performed_at", { ascending: false }).limit(limit);
        return Response.json({ auditLog: data ?? [] });
      },
    },
  },
});