import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/mcp/disconnect/$serverId")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { MCPGatewayManager } = await import("@/backend/tools/mcp/MCPGatewayManager.server");
        await MCPGatewayManager.disconnectServer(params.serverId);
        return Response.json({ success: true });
      },
    },
  },
});