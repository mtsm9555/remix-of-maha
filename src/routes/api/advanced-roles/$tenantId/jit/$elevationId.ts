import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/advanced-roles/$tenantId/jit/$elevationId")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const body = (await request.json().catch(() => ({}))) as { action?: "approve" | "reject" };
        const { JITRoleElevationManager } = await import(
          "@/backend/tenant/roles/JITRoleElevationManager.server"
        );
        try {
          if (body.action === "approve") {
            await JITRoleElevationManager.approveElevation(params.elevationId, userId);
          } else if (body.action === "reject") {
            await JITRoleElevationManager.rejectElevation(params.elevationId, userId);
          } else {
            return Response.json({ error: "action must be approve or reject" }, { status: 400 });
          }
          return Response.json({ success: true });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 400 });
        }
      },
    },
  },
});