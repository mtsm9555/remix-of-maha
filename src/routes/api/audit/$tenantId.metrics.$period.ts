import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/metrics/$period")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { AuditQueryEngine } = await import("@/backend/security/audit/AuditQueryEngine.server");
        const metrics = await AuditQueryEngine.getMetrics(params.tenantId, params.period);
        return Response.json({ metrics });
      },
    },
  },
});
