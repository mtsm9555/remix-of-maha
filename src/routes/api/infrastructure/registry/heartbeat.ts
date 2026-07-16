import { createFileRoute } from "@tanstack/react-router";
import { AgentRegistryStore } from "@/backend/infrastructure/registry/AgentRegistryStore";

export const Route = createFileRoute("/api/infrastructure/registry/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { instanceId, currentLoad } = (await request.json()) as {
          instanceId: string;
          currentLoad: number;
        };
        if (!instanceId) {
          return new Response(JSON.stringify({ error: "instanceId required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        await AgentRegistryStore.updateHeartbeat(instanceId, Number(currentLoad ?? 0));
        return Response.json({ success: true });
      },
    },
  },
});