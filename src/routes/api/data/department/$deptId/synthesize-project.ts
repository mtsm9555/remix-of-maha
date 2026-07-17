import { createFileRoute } from "@tanstack/react-router";
import type { Department } from "@/backend/agents/departments/types";

export const Route = createFileRoute("/api/data/department/$deptId/synthesize-project")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const deptId = params.deptId as Department;
        const body = await request.json().catch(() => ({}));
        const projectId = typeof body?.projectId === "string" ? body.projectId : "";
        if (!projectId) {
          return Response.json({ error: "projectId required" }, { status: 400 });
        }
        const { ProjectToDepartmentSynthesizer } = await import(
          "@/backend/data/department/ProjectToDepartmentSynthesizer.server"
        );
        const memoriesStored =
          await ProjectToDepartmentSynthesizer.synthesizeProjectLearnings(projectId, deptId);
        return Response.json({
          success: true,
          memoriesStored,
          message: `Extracted ${memoriesStored} departmental lessons from project.`,
        });
      },
    },
  },
});