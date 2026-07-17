import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/scaling/policies/$policyId/predict")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { ScalingEngine } = await import("@/backend/infrastructure/scaling/ScalingEngine.server");
        const { PredictiveScaler } = await import("@/backend/infrastructure/scaling/PredictiveScaler.server");
        const policy = await ScalingEngine.getPolicy(params.policyId);
        if (!policy) return Response.json({ error: "not_found" }, { status: 404 });
        const predictions = await PredictiveScaler.generatePredictions(policy);
        return Response.json({ predictions });
      },
    },
  },
});