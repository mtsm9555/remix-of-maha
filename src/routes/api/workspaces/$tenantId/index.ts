import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/workspaces/$tenantId/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        const workspaces = await WorkspaceManager.getWorkspaces(params.tenantId, userId);
        return Response.json({ workspaces });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const body = await request.json().catch(() => ({}));
        const { name, type, description, isolationLevel, isolationPolicy, resourceQuota, tags } = body ?? {};
        if (!name || !type) return new Response("name and type required", { status: 400 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        try {
          const workspace = await WorkspaceManager.createWorkspace(
            params.tenantId, name, type, userId,
            { description, isolationLevel, isolationPolicy, resourceQuota, tags },
          );
          return Response.json({ workspace });
        } catch (e) {
          return new Response((e as Error).message, { status: 400 });
        }
      },
    },
  },
});