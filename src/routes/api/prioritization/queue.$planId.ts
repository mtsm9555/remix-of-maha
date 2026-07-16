import { createFileRoute } from "@tanstack/react-router";
import { PrioritizationEngine } from "@/backend/intelligence/prioritization/PrioritizationEngine";

export const Route = createFileRoute("/api/prioritization/queue/$planId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const planId = params.planId;
        await PrioritizationEngine.reevaluatePlan(planId);
        const queue = Array.from(PrioritizationEngine.getScores().values()).sort(
          (a, b) => b.finalScore - a.finalScore,
        );
        return Response.json({ planId, queue, generatedAt: new Date() });
      },
    },
  },
});
