import { createFileRoute } from "@tanstack/react-router";
import { HealthAggregator } from "@/backend/infrastructure/health/HealthAggregator";

export const Route = createFileRoute("/api/infrastructure/health/$instanceId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { score, anomalies } = await HealthAggregator.evaluateInstanceHealth(
          params.instanceId,
        );
        return Response.json({ score, anomalies });
      },
    },
  },
});