import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/teams/$tenantId/tree")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { AdvancedTeamManager } = await import(
          "@/backend/tenant/teams/AdvancedTeamManager.server"
        );
        return Response.json({ tree: await AdvancedTeamManager.getTeamTree(params.tenantId) });
      },
    },
  },
});
