import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/queues/$queueId/resume")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { MultiQueueManager } = await import("@/backend/infrastructure/queue/MultiQueueManager.server");
        await MultiQueueManager.resumeQueue(params.queueId);
        return Response.json({ success: true });
      },
    },
  },
});