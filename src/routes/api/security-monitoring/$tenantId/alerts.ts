import { createFileRoute } from "@tanstack/react-router";
import { SecurityAlertManager } from "@/backend/security/monitoring/SecurityAlertManager.server";

export const Route = createFileRoute("/api/security-monitoring/$tenantId/alerts")({
  server: {
    handlers: {
      GET: async ({ params }) => Response.json({ alerts: await SecurityAlertManager.getActiveAlerts(params.tenantId) }),
    },
  },
});