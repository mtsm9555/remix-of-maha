import { createFileRoute } from "@tanstack/react-router";
import { TestRunner } from "@/backend/testing/TestRunner.server";

export const Route = createFileRoute("/api/testing/$tenantId/suites/$suiteId/run")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json().catch(() => ({} as any));
        const run = await TestRunner.runSuite(
          params.suiteId,
          params.tenantId,
          body.triggeredBy || "system",
          body.environment || "development",
        );
        return Response.json({ success: true, run });
      },
    },
  },
});