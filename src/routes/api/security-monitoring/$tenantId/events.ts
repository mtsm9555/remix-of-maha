import { createFileRoute } from "@tanstack/react-router";
import { SecurityEventCollector } from "@/backend/security/monitoring/SecurityEventCollector.server";

export const Route = createFileRoute("/api/security-monitoring/$tenantId/events")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? 100);
        const events = await SecurityEventCollector.getRecentEvents(params.tenantId, limit);
        return Response.json({ events });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const event = await SecurityEventCollector.collect(
          body.eventType,
          body.severity,
          params.tenantId,
          body.actor,
          body.context,
        );
        return Response.json({ event });
      },
    },
  },
});