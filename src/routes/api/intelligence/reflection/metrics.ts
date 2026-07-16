import { createFileRoute } from "@tanstack/react-router";
import { SelfReflectionEngine } from "@/backend/intelligence/reflection/SelfReflectionEngine";

export const Route = createFileRoute("/api/intelligence/reflection/metrics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const agentId = url.searchParams.get("agentId");
        const metrics = SelfReflectionEngine.getMetrics(agentId);
        return Response.json({ metrics: metrics ?? null });
      },
    },
  },
});
