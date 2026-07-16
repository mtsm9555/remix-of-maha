import { createFileRoute } from "@tanstack/react-router";
import { AdvancedGoalDecomposer } from "@/backend/intelligence/AdvancedGoalDecomposer";

export const Route = createFileRoute("/api/planning/goal/intelligent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const goal = typeof body?.goal === "string" ? body.goal : "";
          const userId = typeof body?.userId === "string" ? body.userId : "anonymous";
          if (!goal) {
            return Response.json({ error: "Missing goal" }, { status: 400 });
          }

          const plan = await AdvancedGoalDecomposer.decomposeIntelligently(goal, userId);
          const recursiveBreakdowns = plan.milestones.filter((m) =>
            m.id.includes("_sub_"),
          ).length;

          return Response.json({
            success: true,
            plan: {
              ...plan,
              historicalAdjustments: Object.fromEntries(plan.historicalAdjustments),
            },
            confidence: plan.overallConfidenceScore,
            adjustmentsMade: plan.historicalAdjustments.size,
            recursiveBreakdowns,
          });
        } catch (error: any) {
          return Response.json(
            { error: error?.message ?? "Unknown error" },
            { status: 500 },
          );
        }
      },
    },
  },
});