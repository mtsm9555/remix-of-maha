import { createFileRoute } from "@tanstack/react-router";
import { SecurityAlertManager } from "@/backend/security/monitoring/SecurityAlertManager.server";

export const Route = createFileRoute("/api/security-monitoring/alerts/$alertId/resolve")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { resolvedBy } = await request.json();
        await SecurityAlertManager.resolveAlert(params.alertId, resolvedBy);
        return Response.json({ ok: true });
      },
    },
  },
});