import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/workspaces/$workspaceId/cross-access")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        const role = await WorkspaceManager.getUserRole(params.workspaceId, userId);
        if (role !== "owner" && role !== "admin") return new Response("Forbidden", { status: 403 });
        const body = await request.json().catch(() => ({} as { targetWorkspaceId?: string; accessType?: "read" | "write" | "admin"; expiresAt?: string }));
        const { targetWorkspaceId, accessType, expiresAt } = body;
        if (!targetWorkspaceId || !accessType) return new Response("targetWorkspaceId and accessType required", { status: 400 });
        const { WorkspaceIsolationEngine } = await import("@/backend/tenant/workspaces/WorkspaceIsolationEngine.server");
        try {
          const record = await WorkspaceIsolationEngine.grantCrossWorkspaceAccess(
            params.workspaceId, targetWorkspaceId, accessType, userId,
            expiresAt ? new Date(expiresAt) : undefined,
          );
          return Response.json({ record });
        } catch (e) {
          return new Response((e as Error).message, { status: 400 });
        }
      },
    },
  },
});