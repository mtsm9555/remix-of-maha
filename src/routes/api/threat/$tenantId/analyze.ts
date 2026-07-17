import { createFileRoute } from "@tanstack/react-router";
import { BehavioralAnalyticsEngine } from "@/backend/security/threat/BehavioralAnalyticsEngine.server";

export const Route = createFileRoute("/api/threat/$tenantId/analyze")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json();
        const anomalies = await BehavioralAnalyticsEngine.analyzeActivity(
          params.tenantId,
          body.entityId,
          body.entityType,
          body.metrics ?? {},
          body.context ?? {},
        );
        return Response.json({ anomalies });
      },
    },
  },
});