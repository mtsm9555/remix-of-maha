import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/intelligence/compression/stats")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          totalTokensSavedToday: 1450000,
          averageCompressionRatio: 0.35,
          estimatedCostSavingsUSD: 14.5,
        });
      },
    },
  },
});
