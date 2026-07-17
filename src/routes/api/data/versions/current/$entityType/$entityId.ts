import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/data/versions/current/$entityType/$entityId",
)({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { KnowledgeVersionStore } = await import(
          "@/backend/data/versioning/KnowledgeVersionStore.server"
        );
        const version = await KnowledgeVersionStore.getCurrentVersion(
          params.entityId,
          params.entityType as never,
        );
        if (!version)
          return Response.json({ error: "No versions found" }, { status: 404 });
        return Response.json({ version });
      },
    },
  },
});