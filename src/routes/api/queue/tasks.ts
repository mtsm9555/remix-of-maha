import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/tasks")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as any;
        if (!body?.queueId || !body?.tenantId || !body?.type) {
          return Response.json({ error: "queueId, tenantId, type required" }, { status: 400 });
        }
        const { PriorityScheduler } = await import("@/backend/infrastructure/queue/PriorityScheduler.server");
        const id = await PriorityScheduler.enqueue({
          queueId: body.queueId,
          tenantId: body.tenantId,
          workspaceId: body.workspaceId,
          type: body.type,
          payload: body.payload ?? {},
          priority: body.priority ?? 3,
          dependsOn: body.dependsOn ?? [],
          metadata: body.metadata ?? {},
          maxAttempts: body.maxAttempts,
          timeoutMs: body.timeoutMs,
          correlationId: body.correlationId,
        });
        return Response.json({ taskId: id });
      },
    },
  },
});