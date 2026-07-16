import { createFileRoute } from "@tanstack/react-router";
import { AgentRegistryStore } from "@/backend/infrastructure/registry/AgentRegistryStore";

export const Route = createFileRoute("/api/infrastructure/registry/")({
  server: {
    handlers: {
      GET: async () => {
        const agents = await AgentRegistryStore.searchAgents({});
        return Response.json({ agents, total: agents.length });
      },
    },
  },
});