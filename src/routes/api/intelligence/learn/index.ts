import { createFileRoute } from "@tanstack/react-router";
import type { Department } from "@/backend/agents/departments/types";
import { LearningEngine } from "@/backend/intelligence/learning/LearningEngine";

export const Route = createFileRoute("/api/intelligence/learn/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { agentId, department } = (await request.json()) as {
          agentId: string;
          department: Department;
        };
        if (!agentId || !department) {
          return new Response(JSON.stringify({ error: "agentId and department required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const cycle = await LearningEngine.executeLearningCycle(agentId, department, "manual");
        return Response.json({ success: true, cycle });
      },
    },
  },
});