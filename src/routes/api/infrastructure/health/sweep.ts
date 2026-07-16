import { createFileRoute } from "@tanstack/react-router";
import { HealthMonitorWorker } from "@/backend/workers/HealthMonitorWorker";

export const Route = createFileRoute("/api/infrastructure/health/sweep")({
  server: {
    handlers: {
      POST: async () => {
        const result = await HealthMonitorWorker.runHealthChecks();
        return Response.json({ success: true, ...result });
      },
    },
  },
});