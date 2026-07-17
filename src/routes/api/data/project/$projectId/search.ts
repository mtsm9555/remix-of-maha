import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/project/$projectId/search")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { projectId } = params;
        const body = (await request.json().catch(() => ({}))) as {
          query?: string;
          types?: string[];
          limit?: number;
          minConfidence?: number;
        };
        if (!body.query) {
          return Response.json({ error: "query is required" }, { status: 400 });
        }
        try {
          const { generateEmbedding } = await import(
            "@/backend/data/project/EmbeddingClient.server"
          );
          const { ProjectMemoryStore } = await import(
            "@/backend/data/project/ProjectMemoryStore.server"
          );
          const embedding = await generateEmbedding(body.query);
          const results = await ProjectMemoryStore.searchMemories({
            projectId,
            queryText: body.query,
            queryEmbedding: embedding,
            types: body.types as any,
            limit: body.limit,
            minConfidence: body.minConfidence,
          });
          return Response.json({ results });
        } catch (err: any) {
          return Response.json(
            { error: err?.message ?? String(err) },
            { status: 500 },
          );
        }
      },
    },
  },
});