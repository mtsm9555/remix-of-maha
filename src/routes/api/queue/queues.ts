import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/queues")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tenantId = url.searchParams.get("tenantId") ?? undefined;
        const { MultiQueueManager } = await import("@/backend/infrastructure/queue/MultiQueueManager.server");
        const queues = await MultiQueueManager.getQueues(tenantId);
        return Response.json({ queues });
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as any;
        if (!body?.name || !body?.type) return Response.json({ error: "name and type required" }, { status: 400 });
        const { MultiQueueManager } = await import("@/backend/infrastructure/queue/MultiQueueManager.server");
        try {
          const queue = await MultiQueueManager.createQueue(body.name, body.type, {
            description: body.description,
            maxConcurrentTasks: body.maxConcurrentTasks,
            defaultTimeoutMs: body.defaultTimeoutMs,
            defaultMaxRetries: body.defaultMaxRetries,
            tenantId: body.tenantId,
          });
          return Response.json({ queue });
        } catch (err: any) {
          return Response.json({ error: err?.message ?? String(err) }, { status: 500 });
        }
      },
    },
  },
});