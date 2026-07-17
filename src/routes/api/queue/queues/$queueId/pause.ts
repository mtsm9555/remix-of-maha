import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/queues/$queueId/pause")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { MultiQueueManager } = await import("@/backend/infrastructure/queue/MultiQueueManager.server");
        await MultiQueueManager.pauseQueue(params.queueId);
        return Response.json({ success: true });
      },
    },
  },
});