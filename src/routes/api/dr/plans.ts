import { createFileRoute } from "@tanstack/react-router";
import type { FailoverStep, FailoverTrigger } from "@/backend/infrastructure/dr/DisasterRecoveryTypes";

export const Route = createFileRoute("/api/dr/plans")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tenantId = new URL(request.url).searchParams.get("tenantId");
        if (!tenantId) return new Response("tenantId required", { status: 400 });
        const { FailoverOrchestrator } = await import(
          "@/backend/infrastructure/dr/FailoverOrchestrator.server"
        );
        return Response.json(await FailoverOrchestrator.listFailoverPlans(tenantId));
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          tenantId: string;
          name: string;
          description?: string;
          sourceRegionId: string;
          targetRegionId: string;
          failoverType: "automatic" | "manual";
          rtoSeconds: number;
          rpoSeconds: number;
          triggers?: FailoverTrigger[];
          steps?: FailoverStep[];
        };
        const { FailoverOrchestrator } = await import(
          "@/backend/infrastructure/dr/FailoverOrchestrator.server"
        );
        const plan = await FailoverOrchestrator.createFailoverPlan(body.tenantId, body.name, body);
        return Response.json(plan, { status: 201 });
      },
    },
  },
});