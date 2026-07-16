import { createFileRoute } from "@tanstack/react-router";
import { CapabilityStore } from "@/backend/infrastructure/capabilities/CapabilityStore";
import type { CapabilitySearchQuery } from "@/backend/infrastructure/capabilities/CapabilityTypes";

export const Route = createFileRoute("/api/infrastructure/capabilities/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as CapabilitySearchQuery;
        const agents = await CapabilityStore.searchAgentsByCapabilities(body ?? {});
        return Response.json({ agents });
      },
    },
  },
});