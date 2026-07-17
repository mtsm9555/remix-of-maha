import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/project/$projectId/context")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { projectId } = params;
        try {
          const { ProjectMemoryStore } = await import(
            "@/backend/data/project/ProjectMemoryStore.server"
          );
          const context = await ProjectMemoryStore.getProjectContext(projectId);
          return Response.json({ context });
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