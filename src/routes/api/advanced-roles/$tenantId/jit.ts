import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/advanced-roles/$tenantId/jit")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const { JITRoleElevationManager } = await import(
          "@/backend/tenant/roles/JITRoleElevationManager.server"
        );
        return Response.json({
          requests: await JITRoleElevationManager.listPending(params.tenantId),
        });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const body = (await request.json().catch(() => ({}))) as {
          targetRoleId?: string; reason?: string; durationHours?: number;
        };
        if (!body.targetRoleId || !body.reason)
          return Response.json({ error: "targetRoleId and reason required" }, { status: 400 });
        const { JITRoleElevationManager } = await import(
          "@/backend/tenant/roles/JITRoleElevationManager.server"
        );
        const elevation = await JITRoleElevationManager.requestElevation(
          userId, params.tenantId, body.targetRoleId, body.reason, body.durationHours ?? 2,
        );
        return Response.json({ success: true, elevation });
      },
    },
  },
});