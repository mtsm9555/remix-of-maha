import { createFileRoute } from "@tanstack/react-router";
import { orchestrator } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/goals")({
  server: {
    handlers: {
      GET: () => Response.json(orchestrator.getAllGoals()),
      POST: async ({ request }) => {
        const { id, title, description } = await request.json();
        return Response.json(orchestrator.createGoal(id, title, description));
      },
    },
  },
});