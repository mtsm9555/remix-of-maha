import { createFileRoute } from "@tanstack/react-router";
import { ThreatIntelligenceManager } from "@/backend/security/threat/ThreatIntelligenceManager.server";

export const Route = createFileRoute("/api/threat/$tenantId/iocs")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const iocs = await ThreatIntelligenceManager.getIOCs(params.tenantId, {
          type: (url.searchParams.get("type") as any) ?? undefined,
          category: (url.searchParams.get("category") as any) ?? undefined,
          severity: (url.searchParams.get("severity") as any) ?? undefined,
          limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
        });
        return Response.json({ iocs });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const ioc = await ThreatIntelligenceManager.registerIOC(
          params.tenantId,
          body.type,
          body.value,
          body.category,
          body.options ?? {},
        );
        return Response.json({ ioc });
      },
    },
  },
});