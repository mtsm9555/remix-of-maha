import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/tasks/$taskId/complete")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json().catch(() => ({}))) as { result?: unknown };
        const { PriorityScheduler } = await import("@/backend/infrastructure/queue/PriorityScheduler.server");
        await PriorityScheduler.completeTask(params.taskId, body?.result);
        return Response.json({ success: true });
      },
    },
  },
});