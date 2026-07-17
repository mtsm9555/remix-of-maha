import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/org/$tenantId/roles")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { PermissionEngine } = await import("@/backend/tenant/organization/PermissionEngine.server");
        const canView = await PermissionEngine.hasPermission(params.tenantId, userId, "data:read");
        if (!canView) return new Response("Forbidden", { status: 403 });
        return Response.json({ roles: await PermissionEngine.getRoles(params.tenantId) });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { PermissionEngine } = await import("@/backend/tenant/organization/PermissionEngine.server");
        try {
          await PermissionEngine.enforcePermission(params.tenantId, userId, "org:roles:manage");
        } catch {
          return new Response("Forbidden", { status: 403 });
        }
        const body = (await request.json()) as {
          name?: string; description?: string; permissions?: string[];
        };
        if (!body.name || !body.permissions) {
          return Response.json({ error: "name and permissions required" }, { status: 400 });
        }
        const role = await PermissionEngine.createRole(
          params.tenantId, body.name, body.description ?? "", body.permissions as never,
        );
        return Response.json({ success: true, role });
      },
    },
  },
});
