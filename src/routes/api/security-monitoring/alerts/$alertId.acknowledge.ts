import { createFileRoute } from "@tanstack/react-router";
import { SecurityAlertManager } from "@/backend/security/monitoring/SecurityAlertManager.server";

export const Route = createFileRoute("/api/security-monitoring/alerts/$alertId/acknowledge")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { acknowledgedBy } = await request.json();
        await SecurityAlertManager.acknowledgeAlert(params.alertId, acknowledgedBy);
        return Response.json({ ok: true });
      },
    },
  },
});