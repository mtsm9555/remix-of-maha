import { createFileRoute } from "@tanstack/react-router";
import type { Department } from "@/backend/agents/departments/types";
import { KnowledgeGraphExpander } from "@/backend/intelligence/graph/KnowledgeGraphExpander";

export const Route = createFileRoute("/api/intelligence/graph/expand")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { department } = (await request.json()) as { department: Department };
        if (!department) {
          return new Response(JSON.stringify({ error: "department required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const results = await KnowledgeGraphExpander.expandDepartmentGraph(department);
        return Response.json({ success: true, department, ...results });
      },
    },
  },
});
