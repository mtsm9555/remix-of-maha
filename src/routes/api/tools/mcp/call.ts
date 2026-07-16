import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/mcp/call")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { serverId, toolName, arguments: args, agentName } = (await request.json()) as {
          serverId: string;
          toolName: string;
          arguments?: Record<string, any>;
          agentName?: string;
        };
        if (!serverId || !toolName) {
          return Response.json({ error: "serverId and toolName are required" }, { status: 400 });
        }
        try {
          const { MCPGatewayManager } = await import("@/backend/tools/mcp/MCPGatewayManager.server");
          const result = await MCPGatewayManager.callTool(serverId, toolName, args ?? {}, agentName);
          return Response.json({ success: true, result });
        } catch (err: any) {
          return Response.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
        }
      },
    },
  },
});