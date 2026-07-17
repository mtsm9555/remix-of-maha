import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/advanced-roles/$tenantId/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const { AdvancedRoleManager } = await import(
          "@/backend/tenant/roles/AdvancedRoleManager.server"
        );
        return Response.json({ roles: await AdvancedRoleManager.getRoles(params.tenantId) });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const body = (await request.json().catch(() => ({}))) as {
          name?: string; description?: string; permissions?: string[];
          parentRoleId?: string | null; conditionalPermissions?: any[];
        };
        if (!body.name || !Array.isArray(body.permissions))
          return Response.json({ error: "name and permissions required" }, { status: 400 });
        const { AdvancedRoleManager } = await import(
          "@/backend/tenant/roles/AdvancedRoleManager.server"
        );
        const role = await AdvancedRoleManager.createRole(
          params.tenantId, body.name, body.description ?? "", body.permissions,
          body.parentRoleId ?? null, body.conditionalPermissions ?? [], userId,
        );
        return Response.json({ success: true, role });
      },
    },
  },
});