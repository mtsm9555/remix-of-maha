import { createFileRoute } from "@tanstack/react-router";
import { orchestrator } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/goals/$id")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const goal = orchestrator.getGoal(params.id);
        if (!goal) return Response.json({ error: "Goal not found" }, { status: 404 });
        return Response.json(goal);
      },
    },
  },
});