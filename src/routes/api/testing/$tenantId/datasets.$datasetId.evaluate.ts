import { createFileRoute } from "@tanstack/react-router";
import { AgentEvaluator } from "@/backend/testing/AgentEvaluator.server";

export const Route = createFileRoute("/api/testing/$tenantId/datasets/$datasetId/evaluate")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json();
        const evaluations = await AgentEvaluator.evaluateAgainstDataset(
          params.datasetId,
          params.tenantId,
          body.agentId,
          body.runId,
        );
        return Response.json({ success: true, evaluations });
      },
    },
  },
});