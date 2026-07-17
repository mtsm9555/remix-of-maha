import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/workspaces/$workspaceId/budget")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        if (!(await WorkspaceManager.hasAccess(params.workspaceId, userId)))
          return new Response("Forbidden", { status: 403 });
        const { WorkspaceResourceManager } = await import("@/backend/tenant/workspaces/WorkspaceResourceManager.server");
        const status = await WorkspaceResourceManager.canAllocate(params.workspaceId, "monthlyBudgetUSD", 0);
        return Response.json(status);
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { WorkspaceManager } = await import("@/backend/tenant/workspaces/WorkspaceManager.server");
        const role = await WorkspaceManager.getUserRole(params.workspaceId, userId);
        if (role !== "owner" && role !== "admin") return new Response("Forbidden", { status: 403 });
        const body = await request.json().catch(() => ({} as { amountUsd?: number; description?: string }));
        const { amountUsd, description } = body;
        if (typeof amountUsd !== "number") return new Response("amountUsd required", { status: 400 });
        const { WorkspaceResourceManager } = await import("@/backend/tenant/workspaces/WorkspaceResourceManager.server");
        await WorkspaceResourceManager.recordBudgetUsage(params.workspaceId, amountUsd, description);
        return Response.json({ ok: true });
      },
    },
  },
});