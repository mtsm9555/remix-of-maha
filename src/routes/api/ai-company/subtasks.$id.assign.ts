import { createFileRoute } from "@tanstack/react-router";
import { orchestrator } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/subtasks/$id/assign")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const { agentId } = await request.json();
          return Response.json(orchestrator.assignSubTask(params.id, agentId));
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 400 });
        }
      },
    },
  },
});