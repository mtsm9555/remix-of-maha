import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dr/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tenantId = new URL(request.url).searchParams.get("tenantId");
        if (!tenantId) return new Response("tenantId required", { status: 400 });
        const { DRTestManager } = await import("@/backend/infrastructure/dr/DRTestManager.server");
        return Response.json(await DRTestManager.getDRDashboard(tenantId));
      },
    },
  },
});