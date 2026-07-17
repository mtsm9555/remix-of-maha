import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/teams/$teamId/budget")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { TeamResourceManager } = await import(
          "@/backend/tenant/teams/TeamResourceManager.server"
        );
        return Response.json({
          budget: await TeamResourceManager.getCurrentMonthBudgetUsage(params.teamId),
        });
      },
    },
  },
});