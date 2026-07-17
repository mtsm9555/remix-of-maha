import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cluster/tasks/$taskId/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const { TaskDistributionEngine } = await import("@/backend/infrastructure/cluster/TaskDistributionEngine.server");
        const task = await TaskDistributionEngine.getTask(params.taskId);
        if (!task) return new Response("Not found", { status: 404 });
        return Response.json({ task });
      },
      DELETE: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const { TaskDistributionEngine } = await import("@/backend/infrastructure/cluster/TaskDistributionEngine.server");
        await TaskDistributionEngine.cancelTask(params.taskId);
        return Response.json({ ok: true });
      },
    },
  },
});