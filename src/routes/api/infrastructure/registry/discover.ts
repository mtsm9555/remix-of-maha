import { createFileRoute } from "@tanstack/react-router";
import { AgentDiscoveryService } from "@/backend/infrastructure/registry/AgentDiscoveryService";
import type { DiscoveryQuery } from "@/backend/infrastructure/registry/AgentRegistryTypes";

export const Route = createFileRoute("/api/infrastructure/registry/discover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const query = (await request.json()) as DiscoveryQuery;
        const bestAgent = await AgentDiscoveryService.discoverBestAgent(query ?? {});
        return Response.json({ bestAgent });
      },
    },
  },
});