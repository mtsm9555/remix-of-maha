import { createFileRoute } from "@tanstack/react-router";
import type { DRTest } from "@/backend/infrastructure/dr/DisasterRecoveryTypes";

export const Route = createFileRoute("/api/dr/tests")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tenantId = new URL(request.url).searchParams.get("tenantId");
        if (!tenantId) return new Response("tenantId required", { status: 400 });
        const { DRTestManager } = await import("@/backend/infrastructure/dr/DRTestManager.server");
        return Response.json(await DRTestManager.getTestHistory(tenantId));
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          tenantId: string;
          planId: string;
          testType: DRTest["testType"];
        };
        const { DRTestManager } = await import("@/backend/infrastructure/dr/DRTestManager.server");
        const test = await DRTestManager.scheduleTest(body.tenantId, body.planId, body.testType);
        return Response.json(test, { status: 201 });
      },
    },
  },
});