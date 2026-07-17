import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cluster/workers/$workerId/claim")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const body = await request.json().catch(() => null) as null | { capabilities?: string[] };
        const { WorkerRegistry } = await import("@/backend/infrastructure/cluster/WorkerRegistry.server");
        const worker = await WorkerRegistry.getWorker(params.workerId);
        if (!worker) return new Response("Not found", { status: 404 });
        const caps = body?.capabilities ?? worker.capabilities;
        const { TaskDistributionEngine } = await import("@/backend/infrastructure/cluster/TaskDistributionEngine.server");
        const task = await TaskDistributionEngine.claimNextTask(params.workerId, caps);
        return Response.json({ task });
      },
    },
  },
});