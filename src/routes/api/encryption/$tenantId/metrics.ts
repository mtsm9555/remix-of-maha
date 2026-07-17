import { createFileRoute } from "@tanstack/react-router";
import { EncryptionAuditLogger } from "@/backend/security/encryption/EncryptionAuditLogger.server";

export const Route = createFileRoute("/api/encryption/$tenantId/metrics")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const days = Number(url.searchParams.get('days') || 30);
        const metrics = await EncryptionAuditLogger.getMetrics(params.tenantId, days);
        return Response.json({ metrics });
      },
    },
  },
});