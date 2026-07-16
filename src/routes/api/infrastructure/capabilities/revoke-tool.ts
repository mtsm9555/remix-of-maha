import { createFileRoute } from "@tanstack/react-router";
import { DynamicCapabilityManager } from "@/backend/infrastructure/capabilities/DynamicCapabilityManager";

export const Route = createFileRoute("/api/infrastructure/capabilities/revoke-tool")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { agentId, toolName } = (await request.json()) as {
          agentId: string;
          toolName: string;
        };
        if (!agentId || !toolName) {
          return new Response(JSON.stringify({ error: "agentId and toolName required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const success = await DynamicCapabilityManager.revokeTool(agentId, toolName);
        return Response.json({ success });
      },
    },
  },
});