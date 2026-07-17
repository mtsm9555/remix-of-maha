import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/org/$tenantId/teams")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { TeamManager } = await import("@/backend/tenant/organization/TeamManager.server");
        return Response.json({ teams: await TeamManager.getTeams(params.tenantId) });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { PermissionEngine } = await import("@/backend/tenant/organization/PermissionEngine.server");
        try {
          await PermissionEngine.enforcePermission(params.tenantId, userId, "org:manage");
        } catch {
          return new Response("Forbidden", { status: 403 });
        }
        const body = (await request.json()) as {
          name?: string; description?: string; departmentId?: string;
        };
        if (!body.name) return Response.json({ error: "name required" }, { status: 400 });
        const { TeamManager } = await import("@/backend/tenant/organization/TeamManager.server");
        const team = await TeamManager.createTeam(
          params.tenantId, body.name, body.description ?? "", body.departmentId,
        );
        return Response.json({ success: true, team });
      },
    },
  },
});