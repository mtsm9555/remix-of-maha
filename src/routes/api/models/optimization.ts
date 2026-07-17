import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models/optimization")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tenantId = url.searchParams.get("tenantId");
        if (!tenantId) return Response.json({ error: "tenantId required" }, { status: 400 });
        const { ModelCostOptimizer } = await import("@/backend/infrastructure/models/ModelCostOptimizer.server");
        const recommendations = await ModelCostOptimizer.getOptimizationRecommendations(tenantId);
        return Response.json({ recommendations });
      },
    },
  },
});