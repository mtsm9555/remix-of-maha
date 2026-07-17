import { createFileRoute } from "@tanstack/react-router";
import { BehavioralAnalyticsEngine } from "@/backend/security/threat/BehavioralAnalyticsEngine.server";

export const Route = createFileRoute("/api/threat/$tenantId/anomalies")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const entityId = url.searchParams.get("entityId");
        if (!entityId) return new Response("entityId required", { status: 400 });
        const anomalies = await BehavioralAnalyticsEngine.getEntityAnomalies(
          params.tenantId,
          entityId,
          Number(url.searchParams.get("limit") ?? 50),
        );
        return Response.json({ anomalies });
      },
    },
  },
});