import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/mcp/connections")({
  server: {
    handlers: {
      GET: async () => {
        const { MCPGatewayManager } = await import("@/backend/tools/mcp/MCPGatewayManager.server");
        const connections = await MCPGatewayManager.listConnections();
        return Response.json({ connections });
      },
    },
  },
});