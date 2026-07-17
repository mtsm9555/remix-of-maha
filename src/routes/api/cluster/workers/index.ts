import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cluster/workers/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const { WorkerRegistry } = await import("@/backend/infrastructure/cluster/WorkerRegistry.server");
        return Response.json({ workers: await WorkerRegistry.getActiveWorkers() });
      },
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const body = await request.json().catch(() => null) as null | {
          hostname?: string; ipAddress?: string; region?: string; zone?: string;
          capabilities?: string[]; maxConcurrentTasks?: number;
          cpuCores?: number; memoryGB?: number; diskGB?: number;
          version?: string; metadata?: Record<string, unknown>;
        };
        if (!body?.hostname || !body.ipAddress || !body.region || !body.zone || !body.capabilities) {
          return new Response("hostname, ipAddress, region, zone, capabilities required", { status: 400 });
        }
        const { WorkerRegistry } = await import("@/backend/infrastructure/cluster/WorkerRegistry.server");
        const worker = await WorkerRegistry.registerWorker({
          hostname: body.hostname, ipAddress: body.ipAddress,
          region: body.region, zone: body.zone, capabilities: body.capabilities,
          maxConcurrentTasks: body.maxConcurrentTasks,
          cpuCores: body.cpuCores, memoryGB: body.memoryGB, diskGB: body.diskGB,
          version: body.version, metadata: body.metadata,
        });
        return Response.json({ worker });
      },
    },
  },
});