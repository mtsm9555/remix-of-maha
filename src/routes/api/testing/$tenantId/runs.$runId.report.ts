import { createFileRoute } from "@tanstack/react-router";
import { TestReporter } from "@/backend/testing/TestReporter.server";

export const Route = createFileRoute("/api/testing/$tenantId/runs/$runId/report")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json().catch(() => ({} as any));
        const report = await TestReporter.generateReport(
          params.runId,
          params.tenantId,
          body.format || "json",
        );
        return Response.json({ success: true, report });
      },
    },
  },
});