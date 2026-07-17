import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/compliance/$tenantId/metrics")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { ComplianceScoringEngine } = await import("@/backend/security/compliance/ComplianceScoringEngine.server");
        return Response.json(await ComplianceScoringEngine.calculateMetrics(params.tenantId));
      },
    },
  },
});