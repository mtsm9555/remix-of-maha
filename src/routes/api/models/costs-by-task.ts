import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models/costs-by-task")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tenantId = url.searchParams.get("tenantId");
        const days = Number(url.searchParams.get("days") ?? 30);
        if (!tenantId) return Response.json({ error: "tenantId required" }, { status: 400 });
        const { ModelCostOptimizer } = await import("@/backend/infrastructure/models/ModelCostOptimizer.server");
        const breakdown = await ModelCostOptimizer.getCostByTaskType(tenantId, days);
        return Response.json({ breakdown });
      },
    },
  },
});