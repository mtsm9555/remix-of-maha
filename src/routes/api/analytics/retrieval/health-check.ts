import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/retrieval/health-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) {
          return new Response("Forbidden", { status: 403 });
        }

        const { MemoryHealthAggregator } = await import(
          "@/backend/data/analytics/MemoryHealthAggregator.server"
        );
        const result = await MemoryHealthAggregator.runDailyHealthCheck();
        return Response.json({ success: true, ...result });
      },
    },
  },
});