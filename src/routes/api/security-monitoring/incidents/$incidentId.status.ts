import { createFileRoute } from "@tanstack/react-router";
import { IncidentManager } from "@/backend/security/monitoring/IncidentManager.server";

export const Route = createFileRoute("/api/security-monitoring/incidents/$incidentId/status")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { status, updatedBy, notes } = await request.json();
        await IncidentManager.updateStatus(params.incidentId, status, updatedBy, notes);
        return Response.json({ ok: true });
      },
    },
  },
});