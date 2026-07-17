import { createFileRoute } from "@tanstack/react-router";
import { BehavioralAnalyticsEngine } from "@/backend/security/threat/BehavioralAnalyticsEngine.server";

export const Route = createFileRoute("/api/threat/$tenantId/baselines")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json();
        const baseline = await BehavioralAnalyticsEngine.buildBaseline(
          params.tenantId,
          body.entityId,
          body.entityType,
          body.lookbackDays ?? 30,
        );
        return Response.json({ baseline });
      },
    },
  },
});