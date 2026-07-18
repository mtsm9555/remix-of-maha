import { createFileRoute } from "@tanstack/react-router";
import { orchestrator } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/goals/$id/plan")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { taskTitles } = await request.json();
        return Response.json(orchestrator.planGoal(params.id, taskTitles || []));
      },
    },
  },
});