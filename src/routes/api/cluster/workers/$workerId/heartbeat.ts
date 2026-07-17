import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cluster/workers/$workerId/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const body = await request.json().catch(() => null) as null | {
          cpuUsage?: number; memoryUsage?: number; diskUsage?: number;
          networkLatencyMs?: number; activeTasks?: number; errors?: string[];
        };
        if (!body || typeof body.cpuUsage !== "number" || typeof body.memoryUsage !== "number" || typeof body.diskUsage !== "number") {
          return new Response("cpuUsage, memoryUsage, diskUsage required", { status: 400 });
        }
        const { WorkerRegistry } = await import("@/backend/infrastructure/cluster/WorkerRegistry.server");
        await WorkerRegistry.heartbeat(params.workerId, {
          cpuUsage: body.cpuUsage, memoryUsage: body.memoryUsage, diskUsage: body.diskUsage,
          networkLatencyMs: body.networkLatencyMs, activeTasks: body.activeTasks, errors: body.errors,
        });
        return Response.json({ ok: true });
      },
    },
  },
});