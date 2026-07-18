import { createFileRoute } from "@tanstack/react-router";
import { agentRegistry } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/agents")({
  server: {
    handlers: {
      GET: () => Response.json(agentRegistry.getAllAgents()),
      POST: async ({ request }) => {
        const { id, name, role, skills } = await request.json();
        const agent = agentRegistry.createAgent(id, name, role, skills || []);
        return Response.json(agent);
      },
    },
  },
});