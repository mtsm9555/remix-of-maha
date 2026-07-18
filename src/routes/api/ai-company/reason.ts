import { createFileRoute } from "@tanstack/react-router";
import { reasoningManager } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/reason")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { agentId, goal, context } = await request.json();
        return Response.json(reasoningManager.run({ agentId, goal, context }));
      },
    },
  },
});