import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/org/$tenantId/invites")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { PermissionEngine } = await import("@/backend/tenant/organization/PermissionEngine.server");
        try {
          await PermissionEngine.enforcePermission(params.tenantId, userId, "org:members:invite");
        } catch {
          return new Response("Forbidden", { status: 403 });
        }
        const body = (await request.json()) as { email?: string; role?: string; teamIds?: string[] };
        if (!body.email || !body.role) {
          return Response.json({ error: "email and role required" }, { status: 400 });
        }
        try {
          const { MemberManager } = await import("@/backend/tenant/organization/MemberManager.server");
          const invite = await MemberManager.inviteMember(
            params.tenantId, body.email, body.role, body.teamIds ?? [], userId,
          );
          return Response.json({ success: true, invite });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Invite failed" }, { status: 400 });
        }
      },
    },
  },
});
