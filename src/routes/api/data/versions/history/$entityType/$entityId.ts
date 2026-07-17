import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/data/versions/history/$entityType/$entityId",
)({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? 50);

        const { KnowledgeVersionStore } = await import(
          "@/backend/data/versioning/KnowledgeVersionStore.server"
        );
        const versions = await KnowledgeVersionStore.getVersionHistory(
          params.entityId,
          params.entityType as never,
          limit,
        );
        return Response.json({ versions });
      },
    },
  },
});