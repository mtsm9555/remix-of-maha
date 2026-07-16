import { createFileRoute } from "@tanstack/react-router";
import { SelfReflectionEngine } from "@/backend/intelligence/reflection/SelfReflectionEngine";

export const Route = createFileRoute("/api/intelligence/reflection/metrics/reset")({
  server: {
    handlers: {
      POST: async () => {
        SelfReflectionEngine.resetMetrics();
        return Response.json({ success: true, message: "Metrics reset." });
      },
    },
  },
});
