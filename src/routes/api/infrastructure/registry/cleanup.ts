import { createFileRoute } from "@tanstack/react-router";
import { AgentDiscoveryService } from "@/backend/infrastructure/registry/AgentDiscoveryService";

export const Route = createFileRoute("/api/infrastructure/registry/cleanup")({
  server: {
    handlers: {
      POST: async () => {
        const result = await AgentDiscoveryService.cleanupGhosts();
        return Response.json({ success: true, ...result });
      },
    },
  },
});