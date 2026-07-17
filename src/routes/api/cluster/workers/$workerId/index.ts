import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cluster/workers/$workerId/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const { WorkerRegistry } = await import("@/backend/infrastructure/cluster/WorkerRegistry.server");
        const { TaskDistributionEngine } = await import("@/backend/infrastructure/cluster/TaskDistributionEngine.server");
        const worker = await WorkerRegistry.getWorker(params.workerId);
        if (!worker) return new Response("Not found", { status: 404 });
        const [healthChecks, tasks] = await Promise.all([
          WorkerRegistry.getHealthChecks(params.workerId, 50),
          TaskDistributionEngine.listTasks({ workerId: params.workerId, limit: 20 }),
        ]);
        return Response.json({ worker, healthChecks, tasks });
      },
      DELETE: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const { WorkerRegistry } = await import("@/backend/infrastructure/cluster/WorkerRegistry.server");
        await WorkerRegistry.deregister(params.workerId);
        return Response.json({ ok: true });
      },
    },
  },
});