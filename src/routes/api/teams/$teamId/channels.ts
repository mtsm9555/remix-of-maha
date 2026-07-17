import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/teams/$teamId/channels")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { TeamCollaborationEngine } = await import(
          "@/backend/tenant/teams/TeamCollaborationEngine.server"
        );
        return Response.json({
          channels: await TeamCollaborationEngine.getTeamChannels(params.teamId, userId),
        });
      },
    },
  },
});
