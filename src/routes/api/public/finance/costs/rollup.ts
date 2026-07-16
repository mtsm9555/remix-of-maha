import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/finance/costs/rollup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SESSION_SECRET;
        if (!secret || request.headers.get("x-cron-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { CostAggregator } = await import(
          "@/backend/tools/cost/CostAggregator.server"
        );
        try {
          const count = await CostAggregator.generateHourlyDepartmentRollups();
          return Response.json({ success: true, rollups: count });
        } catch (err) {
          return Response.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          );
        }
      },
    },
  },
});