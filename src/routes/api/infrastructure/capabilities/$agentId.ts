import { createFileRoute } from "@tanstack/react-router";
import { CapabilityStore } from "@/backend/infrastructure/capabilities/CapabilityStore";

export const Route = createFileRoute("/api/infrastructure/capabilities/$agentId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const map = await CapabilityStore.getAgentCapabilities(params.agentId);
        if (!map) {
          return new Response(JSON.stringify({ error: "Agent not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ map });
      },
    },
  },
});