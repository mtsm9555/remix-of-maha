import { createFileRoute } from "@tanstack/react-router";
import { IncidentManager } from "@/backend/security/monitoring/IncidentManager.server";

export const Route = createFileRoute("/api/security-monitoring/incidents/$incidentId/actions")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const b = await request.json();
        const action = await IncidentManager.addResponseAction(
          params.incidentId,
          b.action,
          b.performedBy,
          b.details ?? {},
          b.result,
          b.notes,
        );
        return Response.json({ action });
      },
    },
  },
});