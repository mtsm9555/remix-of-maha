import { createFileRoute } from "@tanstack/react-router";
import { SecurityMetricsEngine } from "@/backend/security/monitoring/SecurityMetricsEngine.server";

export const Route = createFileRoute("/api/security-monitoring/$tenantId/dashboard")({
  server: {
    handlers: {
      GET: async ({ params }) => Response.json(await SecurityMetricsEngine.getDashboard(params.tenantId)),
    },
  },
});