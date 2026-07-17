import { createFileRoute } from "@tanstack/react-router";
import { ThreatIntelligenceManager } from "@/backend/security/threat/ThreatIntelligenceManager.server";

export const Route = createFileRoute("/api/threat/$tenantId/feeds/$feedId/sync")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const result = await ThreatIntelligenceManager.syncFeed(params.feedId);
        return Response.json({ result });
      },
    },
  },
});