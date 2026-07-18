import { createFileRoute } from "@tanstack/react-router";
import { agentRegistry } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/agents/$id")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const agent = agentRegistry.getAgent(params.id);
        if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });
        return Response.json(agent);
      },
    },
  },
});