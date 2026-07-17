import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/queues/$queueId/health")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { QueueHealthMonitor } = await import("@/backend/infrastructure/queue/QueueHealthMonitor.server");
        const health = await QueueHealthMonitor.checkQueueHealth(params.queueId);
        return Response.json({ health });
      },
    },
  },
});