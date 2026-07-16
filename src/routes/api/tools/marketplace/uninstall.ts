import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/marketplace/uninstall")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { name } = (await request.json()) as { name?: string };
        if (!name) return Response.json({ error: "name is required" }, { status: 400 });
        const { ToolInstaller } = await import("@/backend/tools/marketplace/ToolInstaller.server");
        await ToolInstaller.uninstallTool(name);
        return Response.json({ success: true });
      },
    },
  },
});