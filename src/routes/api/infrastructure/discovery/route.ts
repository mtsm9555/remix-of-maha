import { createFileRoute } from "@tanstack/react-router";
import { AdvancedDiscoveryService } from "@/backend/infrastructure/discovery/AdvancedDiscoveryService";
import type {
  RoutingStrategy,
  TaskRoutingRequest,
} from "@/backend/infrastructure/discovery/DiscoveryTypes";
import type { Department } from "@/backend/agents/departments/types";

export const Route = createFileRoute("/api/infrastructure/discovery")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          taskDescription: string;
          taskEmbedding?: number[];
          requiredDepartment?: Department;
          requiredTools?: string[];
          strategy?: RoutingStrategy;
          maxBudgetUSD?: number;
          minTrustScore?: number;
        };
        if (!body?.taskDescription) {
          return new Response(JSON.stringify({ error: "taskDescription required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const req: TaskRoutingRequest = {
          taskDescription: body.taskDescription,
          taskEmbedding: body.taskEmbedding ?? [],
          requiredDepartment: body.requiredDepartment,
          requiredTools: body.requiredTools,
          strategy: body.strategy ?? "optimal",
          maxBudgetUSD: body.maxBudgetUSD,
          minTrustScore: body.minTrustScore,
        };
        const result = await AdvancedDiscoveryService.discoverOptimalAgent(req);
        if (!result) {
          return new Response(JSON.stringify({ error: "No suitable agent found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ success: true, routing: result });
      },
    },
  },
});