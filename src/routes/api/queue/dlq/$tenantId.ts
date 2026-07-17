import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/dlq/$tenantId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { RetryAndDeadLetterHandler } = await import(
          "@/backend/infrastructure/queue/RetryAndDeadLetterHandler.server"
        );
        const tasks = await RetryAndDeadLetterHandler.getDeadLetterTasks(params.tenantId);
        return Response.json({ tasks });
      },
    },
  },
});