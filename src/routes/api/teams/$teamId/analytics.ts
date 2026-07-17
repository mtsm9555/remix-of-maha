import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/teams/$teamId/analytics")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { TeamAnalyticsEngine } = await import(
          "@/backend/tenant/teams/TeamAnalyticsEngine.server"
        );
        return Response.json({
          dashboard: await TeamAnalyticsEngine.getDashboardData(params.teamId),
        });
      },
    },
  },
});
