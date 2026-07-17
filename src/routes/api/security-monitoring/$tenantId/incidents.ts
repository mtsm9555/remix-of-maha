import { createFileRoute } from "@tanstack/react-router";
import { IncidentManager } from "@/backend/security/monitoring/IncidentManager.server";

export const Route = createFileRoute("/api/security-monitoring/$tenantId/incidents")({
  server: {
    handlers: {
      GET: async ({ params }) => Response.json({ incidents: await IncidentManager.getOpenIncidents(params.tenantId) }),
      POST: async ({ params, request }) => {
        const b = await request.json();
        const incident = await IncidentManager.createIncident(
          params.tenantId,
          b.title,
          b.description,
          b.severity,
          b.category,
          b.relatedEventIds ?? [],
          b.options ?? {},
        );
        return Response.json({ incident });
      },
    },
  },
});