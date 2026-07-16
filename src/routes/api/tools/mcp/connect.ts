import { createFileRoute } from "@tanstack/react-router";
import type { MCPServerConfig } from "@/backend/tools/mcp/MCPGatewayTypes";
import { MCPSecuritySandbox } from "@/backend/tools/mcp/MCPSecuritySandbox";

export const Route = createFileRoute("/api/tools/mcp/connect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = (await request.json()) as MCPServerConfig;
        const validation = MCPSecuritySandbox.validateServerConfig(config);
        if (!validation.valid) {
          return Response.json({ error: "Security validation failed", details: validation.errors }, { status: 400 });
        }
        try {
          const { MCPGatewayManager } = await import("@/backend/tools/mcp/MCPGatewayManager.server");
          const state = await MCPGatewayManager.connectServer(config);
          return Response.json({ success: true, state });
        } catch (err: any) {
          return Response.json({ error: err?.message ?? String(err) }, { status: 500 });
        }
      },
    },
  },
});