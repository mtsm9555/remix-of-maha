import { createFileRoute } from "@tanstack/react-router";
import { SecurityMetricsEngine } from "@/backend/security/monitoring/SecurityMetricsEngine.server";

export const Route = createFileRoute("/api/security-monitoring/$tenantId/metrics")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const period = url.searchParams.get("period") ?? new Date().toISOString().split("T")[0];
        const metrics = await SecurityMetricsEngine.getMetrics(params.tenantId, period);
        return Response.json({ metrics });
      },
    },
  },
});