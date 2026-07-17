import { createFileRoute } from "@tanstack/react-router";
import { ThreatIntelligenceManager } from "@/backend/security/threat/ThreatIntelligenceManager.server";

export const Route = createFileRoute("/api/threat/$tenantId/iocs/check")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json();
        const match = await ThreatIntelligenceManager.checkIOC(params.tenantId, body.type, body.value);
        return Response.json({ match });
      },
    },
  },
});