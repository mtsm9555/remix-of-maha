import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/workspaces/$workspaceId/members/$userId")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const actorId = await authUserFromRequest(request);
        if (!actorId) return new Response("Unauthorized", { status: 401 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        const role = await WorkspaceManager.getUserRole(params.workspaceId, actorId);
        if (actorId !== params.userId && role !== "owner" && role !== "admin")
          return new Response("Forbidden", { status: 403 });
        try {
          await WorkspaceManager.removeMember(params.workspaceId, params.userId);
          return Response.json({ ok: true });
        } catch (e) {
          return new Response((e as Error).message, { status: 400 });
        }
      },
    },
  },
});