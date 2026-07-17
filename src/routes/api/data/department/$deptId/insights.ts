import { createFileRoute } from "@tanstack/react-router";
import type { Department } from "@/backend/agents/departments/types";

export const Route = createFileRoute("/api/data/department/$deptId/insights")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const deptId = params.deptId as Department;
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? "5") || 5;
        const { DepartmentMemoryEngine } = await import(
          "@/backend/data/department/DepartmentMemoryEngine.server"
        );
        const insights = await DepartmentMemoryEngine.getRecentProjectInsights(deptId, limit);
        return Response.json({ insights });
      },
    },
  },
});