import { createFileRoute } from "@tanstack/react-router";
import { PrioritizationEngine } from "@/backend/intelligence/prioritization/PrioritizationEngine";

export const Route = createFileRoute("/api/prioritization/incident")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { planId, department, reason } = (await request.json()) as {
          planId: string;
          department: string;
          reason: string;
        };
        await PrioritizationEngine.injectCriticalIncident(planId, department, reason);
        return Response.json({ success: true, message: "Incident injected. Queue re-prioritized." });
      },
    },
  },
});
