import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/analytics/tools/rollup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SESSION_SECRET;
        const auth = request.headers.get("x-cron-secret");
        if (!secret || auth !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { ToolAnalyticsAggregator } = await import(
          "@/backend/analytics/tools/ToolAnalyticsAggregator.server"
        );
        const result = await ToolAnalyticsAggregator.generateHourlyRollups();
        return Response.json(result);
      },
    },
  },
});