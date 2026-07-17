import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/shared/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const body = await request.json().catch(() => ({}));
        const query = typeof body?.query === "string" ? body.query : "";
        if (!query) return Response.json({ error: "query required" }, { status: 400 });
        const limit = typeof body?.limit === "number" ? body.limit : 5;

        const { getUserClearance } = await import(
          "@/backend/data/shared/sharedAuth.server"
        );
        const { generateEmbedding } = await import(
          "@/backend/data/project/EmbeddingClient.server"
        );
        const { SharedMemoryStore } = await import(
          "@/backend/data/shared/SharedMemoryStore.server"
        );

        const clearance = await getUserClearance(userId);
        const embedding = await generateEmbedding(query);
        const results = await SharedMemoryStore.searchGlobalMemories(
          embedding,
          clearance,
          limit,
        );
        return Response.json({ clearance, results });
      },
    },
  },
});