import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/scaling/policies/$policyId/evaluate")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { ScalingEngine } = await import("@/backend/infrastructure/scaling/ScalingEngine.server");
        const policy = await ScalingEngine.getPolicy(params.policyId);
        if (!policy) return Response.json({ error: "not_found" }, { status: 404 });
        const event = await ScalingEngine.evaluatePolicy(policy);
        return Response.json({ event });
      },
    },
  },
});