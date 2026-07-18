import { createFileRoute } from "@tanstack/react-router";
import { orchestrator } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/subtasks/$id/complete")({
  server: {
    handlers: {
      POST: ({ params }) => {
        try {
          return Response.json(orchestrator.completeSubTask(params.id));
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 400 });
        }
      },
    },
  },
});