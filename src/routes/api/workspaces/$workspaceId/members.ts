import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/workspaces/$workspaceId/members")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        if (!(await WorkspaceManager.hasAccess(params.workspaceId, userId)))
          return new Response("Forbidden", { status: 403 });
        return Response.json({ members: await WorkspaceManager.listMembers(params.workspaceId) });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const actorId = await authUserFromRequest(request);
        if (!actorId) return new Response("Unauthorized", { status: 401 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        const role = await WorkspaceManager.getUserRole(params.workspaceId, actorId);
        if (role !== "owner" && role !== "admin") return new Response("Forbidden", { status: 403 });
        const body = await request.json().catch(() => ({} as { userId?: string; role?: string; permissions?: string[] }));
        const { userId, role: newRole, permissions } = body;
        if (!userId) return new Response("userId required", { status: 400 });
        try {
          const membership = await WorkspaceManager.addMember(
            params.workspaceId, userId,
            (newRole as "owner" | "admin" | "member" | "viewer") ?? "member",
            permissions ?? [],
          );
          return Response.json({ membership });
        } catch (e) {
          return new Response((e as Error).message, { status: 400 });
        }
      },
    },
  },
});