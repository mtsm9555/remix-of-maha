import { createFileRoute } from "@tanstack/react-router";
import { ThreatIntelligenceManager } from "@/backend/security/threat/ThreatIntelligenceManager.server";

export const Route = createFileRoute("/api/threat/$tenantId/feeds")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json();
        const feed = await ThreatIntelligenceManager.registerFeed(params.tenantId, body);
        return Response.json({ feed });
      },
    },
  },
});