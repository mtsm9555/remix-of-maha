import { createFileRoute } from "@tanstack/react-router";
import { AdvancedDiscoveryService } from "@/backend/infrastructure/discovery/AdvancedDiscoveryService";
import type { TaskRoutingRequest } from "@/backend/infrastructure/discovery/DiscoveryTypes";

export const Route = createFileRoute("/api/infrastructure/discovery/simulate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Partial<TaskRoutingRequest>;
        const req: TaskRoutingRequest = {
          taskDescription: body.taskDescription ?? "simulation",
          taskEmbedding: body.taskEmbedding ?? new Array(1536).fill(0.1),
          requiredDepartment: body.requiredDepartment,
          requiredTools: body.requiredTools,
          strategy: body.strategy ?? "optimal",
          maxBudgetUSD: body.maxBudgetUSD,
          minTrustScore: body.minTrustScore,
        };
        const result = await AdvancedDiscoveryService.discoverOptimalAgent(req);
        return Response.json({ simulationResult: result });
      },
    },
  },
});