import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models/reset-circuit-breaker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as any;
        if (!body?.modelId) return Response.json({ error: "modelId required" }, { status: 400 });
        const { ModelFallbackHandler } = await import("@/backend/infrastructure/models/ModelFallbackHandler.server");
        ModelFallbackHandler.resetCircuitBreaker(body.modelId);
        return Response.json({ ok: true });
      },
    },
  },
});