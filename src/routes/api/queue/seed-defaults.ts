import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/seed-defaults")({
  server: {
    handlers: {
      POST: async () => {
        const { MultiQueueManager } = await import("@/backend/infrastructure/queue/MultiQueueManager.server");
        await MultiQueueManager.seedDefaultQueues();
        return Response.json({ success: true });
      },
    },
  },
});