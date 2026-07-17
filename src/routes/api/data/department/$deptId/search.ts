import { createFileRoute } from "@tanstack/react-router";
import type { Department } from "@/backend/agents/departments/types";

export const Route = createFileRoute("/api/data/department/$deptId/search")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const deptId = params.deptId as Department;
        const body = await request.json().catch(() => ({}));
        const query = typeof body?.query === "string" ? body.query : "";
        if (!query) return Response.json({ error: "query required" }, { status: 400 });

        const { generateEmbedding } = await import(
          "@/backend/data/project/EmbeddingClient.server"
        );
        const { DepartmentMemoryEngine } = await import(
          "@/backend/data/department/DepartmentMemoryEngine.server"
        );
        const embedding = await generateEmbedding(query);
        const results = await DepartmentMemoryEngine.searchMemories({
          departmentId: deptId,
          queryEmbedding: embedding,
          types: body?.types,
          limit: typeof body?.limit === "number" ? body.limit : undefined,
        });
        return Response.json({ results });
      },
    },
  },
});