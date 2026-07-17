import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/queues/$queueId/next")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { PriorityScheduler } = await import("@/backend/infrastructure/queue/PriorityScheduler.server");
        const task = await PriorityScheduler.getNextTask(params.queueId);
        return Response.json({ task });
      },
    },
  },
});