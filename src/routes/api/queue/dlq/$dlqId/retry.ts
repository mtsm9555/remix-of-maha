import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/dlq/$dlqId/retry")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json().catch(() => ({}))) as { retriedBy?: string };
        const { RetryAndDeadLetterHandler } = await import(
          "@/backend/infrastructure/queue/RetryAndDeadLetterHandler.server"
        );
        const newTaskId = await RetryAndDeadLetterHandler.retryDeadLetterTask(params.dlqId, body.retriedBy ?? "system");
        return Response.json({ taskId: newTaskId });
      },
    },
  },
});