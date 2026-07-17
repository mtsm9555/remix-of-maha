import { createFileRoute } from "@tanstack/react-router";
import { AttackChainDetector } from "@/backend/security/threat/AttackChainDetector.server";

export const Route = createFileRoute("/api/threat/$tenantId/chains")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const chains = await AttackChainDetector.getActiveChains(
          params.tenantId,
          Number(url.searchParams.get("limit") ?? 50),
        );
        return Response.json({ chains });
      },
      POST: async ({ params, request }) => {
        const url = new URL(request.url);
        const windowMinutes = Number(url.searchParams.get("windowMinutes") ?? 60);
        const chains = await AttackChainDetector.detectAttackChains(params.tenantId, windowMinutes);
        return Response.json({ chains });
      },
    },
  },
});