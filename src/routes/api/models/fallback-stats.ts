import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models/fallback-stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const days = Number(url.searchParams.get("days") ?? 7);
        const { ModelFallbackHandler } = await import("@/backend/infrastructure/models/ModelFallbackHandler.server");
        const stats = await ModelFallbackHandler.getFallbackStats(days);
        return Response.json({ stats });
      },
    },
  },
});