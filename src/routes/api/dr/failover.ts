import { createFileRoute } from "@tanstack/react-router";
import type { FailoverTrigger } from "@/backend/infrastructure/dr/DisasterRecoveryTypes";

export const Route = createFileRoute("/api/dr/failover")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tenantId = new URL(request.url).searchParams.get("tenantId");
        if (!tenantId) return new Response("tenantId required", { status: 400 });
        const { FailoverOrchestrator } = await import(
          "@/backend/infrastructure/dr/FailoverOrchestrator.server"
        );
        return Response.json(await FailoverOrchestrator.getFailoverHistory(tenantId));
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          tenantId: string;
          planId: string;
          triggerType: FailoverTrigger["type"];
          triggerReason: string;
        };
        const { FailoverOrchestrator } = await import(
          "@/backend/infrastructure/dr/FailoverOrchestrator.server"
        );
        const event = await FailoverOrchestrator.initiateFailover(
          body.tenantId,
          body.planId,
          body.triggerType,
          body.triggerReason,
        );
        return Response.json(event, { status: 202 });
      },
    },
  },
});