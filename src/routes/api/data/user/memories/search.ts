import { createFileRoute } from "@tanstack/react-router";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const Route = createFileRoute("/api/data/user/memories/search")({
  server: {
    middleware: [requireSupabaseAuth],
    handlers: {
      POST: async ({ request, context }) => {
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
          userId: context.userId,
          currentTaskDescription: query,
          taskEmbedding: embedding,
          limit: typeof body?.limit === "number" ? body.limit : undefined,
        });
        return Response.json({ memories });
      },
    },
  },
});