import { createFileRoute } from "@tanstack/react-router";
import { ThreatScoringEngine } from "@/backend/security/threat/ThreatScoringEngine.server";

export const Route = createFileRoute("/api/threat/$tenantId/scores")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const top = await ThreatScoringEngine.getTopThreats(
          params.tenantId,
          Number(url.searchParams.get("limit") ?? 20),
        );
        return Response.json({ top });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const score = await ThreatScoringEngine.calculateThreatScore(
          params.tenantId,
          body.entityId,
          body.entityType,
        );
        return Response.json({ score });
      },
    },
  },
});