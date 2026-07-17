import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/versions/$versionId")({
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
        const version = await KnowledgeVersionStore.getVersion(
          params.versionId,
        );
        if (!version)
          return Response.json({ error: "Version not found" }, { status: 404 });
        return Response.json({ version });
      },
    },
  },
});