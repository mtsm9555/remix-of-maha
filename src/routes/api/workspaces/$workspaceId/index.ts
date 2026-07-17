import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/workspaces/$workspaceId/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        const workspace = await WorkspaceManager.getWorkspace(params.workspaceId);
        if (!workspace) return new Response("Not found", { status: 404 });
        if (!(await WorkspaceManager.hasAccess(params.workspaceId, userId)))
          return new Response("Forbidden", { status: 403 });
        return Response.json({ workspace });
      },
      DELETE: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        const role = await WorkspaceManager.getUserRole(params.workspaceId, userId);
        if (role !== "owner" && role !== "admin") return new Response("Forbidden", { status: 403 });
        await WorkspaceManager.archiveWorkspace(params.workspaceId);
        return Response.json({ ok: true });
      },
    },
  },
});