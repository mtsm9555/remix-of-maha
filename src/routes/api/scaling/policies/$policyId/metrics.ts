import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/scaling/policies/$policyId/metrics")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const hours = Number(url.searchParams.get("hours") ?? "1");
        const { MetricsCollector } = await import("@/backend/infrastructure/scaling/MetricsCollector.server");
        const metrics = await MetricsCollector.getHistoricalMetrics(params.policyId, hours);
        return Response.json({ metrics });
      },
    },
  },
});