import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/org/$tenantId/members")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { PermissionEngine } = await import("@/backend/tenant/organization/PermissionEngine.server");
        try {
          await PermissionEngine.enforcePermission(params.tenantId, userId, "org:members:invite");
        } catch {
          return new Response("Forbidden", { status: 403 });
        }
        const { MemberManager } = await import("@/backend/tenant/organization/MemberManager.server");
        return Response.json({ members: await MemberManager.getMembers(params.tenantId) });
      },
    },
  },
});