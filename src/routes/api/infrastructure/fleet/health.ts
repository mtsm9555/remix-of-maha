import { createFileRoute } from "@tanstack/react-router";
import { AgentHealthMonitor } from "@/backend/infrastructure/lifecycle/AgentHealthMonitor";

export const Route = createFileRoute("/api/infrastructure/fleet/health")({
  server: {
    handlers: {
      POST: async () => {
        const result = AgentHealthMonitor.runHealthSweep();
        return Response.json({ success: true, ...result });
      },
    },
  },
});