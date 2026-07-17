import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/user/memories/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const body = await request.json().catch(() => ({}));
        const query = typeof body?.query === "string" ? body.query : "";
        if (!query) return Response.json({ error: "query required" }, { status: 400 });
        const { generateEmbedding } = await import(
          "@/backend/data/project/EmbeddingClient.server"
        );
        const { UserMemoryStore } = await import(
          "@/backend/data/user/UserMemoryStore.server"
        );
        const embedding = await generateEmbedding(query);
        const memories = await UserMemoryStore.searchMemories({
          userId,
          currentTaskDescription: query,
          taskEmbedding: embedding,
          limit: typeof body?.limit === "number" ? body.limit : undefined,
        });
        return Response.json({ memories });
      },
    },
  },
});