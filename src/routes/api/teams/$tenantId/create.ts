import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/teams/$tenantId/create")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { PermissionEngine } = await import(
          "@/backend/tenant/organization/PermissionEngine.server"
        );
        try {
          await PermissionEngine.enforcePermission(params.tenantId, userId, "org:manage");
        } catch {
          return new Response("Forbidden", { status: 403 });
        }
        const body = (await request.json()) as {
          name?: string; description?: string; parentTeamId?: string;
          departmentId?: string; settings?: Record<string, unknown>;
          quota?: Record<string, unknown>;
        };
        if (!body.name) return Response.json({ error: "name required" }, { status: 400 });
        const { AdvancedTeamManager } = await import(
          "@/backend/tenant/teams/AdvancedTeamManager.server"
        );
        const team = await AdvancedTeamManager.createTeam(
          params.tenantId, body.name, body.description ?? "",
          body.parentTeamId, body.departmentId,
          body.settings as never, body.quota as never,
        );
        return Response.json({ success: true, team });
      },
    },
  },
});
