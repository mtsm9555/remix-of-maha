import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/advanced-roles/$tenantId/$roleId")({
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
        const role = await AdvancedRoleManager.getRole(params.tenantId, params.roleId);
        if (!role) return new Response("Not found", { status: 404 });
        return Response.json({ role });
      },
      PUT: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const updates = (await request.json().catch(() => ({}))) as any;
        const { AdvancedRoleManager } = await import(
          "@/backend/tenant/roles/AdvancedRoleManager.server"
        );
        try {
          const role = await AdvancedRoleManager.updateRole(
            params.tenantId, params.roleId, updates, userId,
          );
          return Response.json({ success: true, role });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 400 });
        }
      },
      DELETE: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const { AdvancedRoleManager } = await import(
          "@/backend/tenant/roles/AdvancedRoleManager.server"
        );
        try {
          await AdvancedRoleManager.deleteRole(params.tenantId, params.roleId, userId);
          return Response.json({ success: true });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 400 });
        }
      },
    },
  },
});