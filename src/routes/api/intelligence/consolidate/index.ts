import { createFileRoute } from "@tanstack/react-router";
import type { Department } from "@/backend/agents/departments/types";
import { ConsolidationRunner } from "@/backend/intelligence/memory/ConsolidationRunner";

export const Route = createFileRoute("/api/intelligence/consolidate/")({
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
        const result = await ConsolidationRunner.consolidateDepartment(department);
        if (result.processed === 0) {
          return Response.json({ success: true, message: "No unconsolidated memories found.", ...result });
        }
        return Response.json({
          success: true,
          message: `Consolidated ${result.processed} raw memories into ${result.memoriesExtracted} long-term memories.`,
          ...result,
        });
      },
    },
  },
});
