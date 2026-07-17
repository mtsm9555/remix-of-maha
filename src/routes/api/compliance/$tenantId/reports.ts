import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/compliance/$tenantId/reports")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { ComplianceScoringEngine } = await import("@/backend/security/compliance/ComplianceScoringEngine.server");
        const { framework, reportType, generatedBy } = await request.json();
        const report = await ComplianceScoringEngine.generateReport(params.tenantId, framework, reportType ?? "assessment", generatedBy ?? "system");
        return Response.json({ report });
      },
    },
  },
});