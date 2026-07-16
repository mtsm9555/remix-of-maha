import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/marketplace/install")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { name, version } = (await request.json()) as { name?: string; version?: string };
        if (!name || !version) {
          return Response.json({ error: "name and version are required" }, { status: 400 });
        }
        try {
          const { ToolInstaller } = await import("@/backend/tools/marketplace/ToolInstaller.server");
          const installed = await ToolInstaller.installTool(name, version);
          return Response.json({ success: true, installed });
        } catch (err: any) {
          return Response.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
        }
      },
    },
  },
});