import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/marketplace/installed")({
  server: {
    handlers: {
      GET: async () => {
        const { ToolInstaller } = await import("@/backend/tools/marketplace/ToolInstaller.server");
        const installed = await ToolInstaller.getInstalledTools();
        return Response.json({ installed });
      },
    },
  },
});