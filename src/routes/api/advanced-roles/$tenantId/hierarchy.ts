import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/advanced-roles/$tenantId/hierarchy")({
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
        return Response.json({
          hierarchy: await AdvancedRoleManager.getRoleHierarchy(params.tenantId),
        });
      },
    },
  },
});