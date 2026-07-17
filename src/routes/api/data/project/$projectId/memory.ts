import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/project/$projectId/memory")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { projectId } = params;
        const body = (await request.json().catch(() => ({}))) as {
          type?: string;
          content?: string;
          tags?: string[];
          confidentiality?: "internal" | "confidential" | "public";
          authorAgentId?: string;
        };
        if (!body.type || !body.content) {
          return Response.json(
            { error: "type and content are required" },
            { status: 400 },
          );
        }
        try {
          const { ProjectMemoryStore } = await import(
            "@/backend/data/project/ProjectMemoryStore.server"
          );
          const record = await ProjectMemoryStore.storeMemory({
            projectId,
            type: body.type as any,
            content: body.content,
            metadata: {
              authorAgentId: body.authorAgentId,
              tags: body.tags ?? [],
              confidentiality: body.confidentiality ?? "internal",
            },
          });
          return Response.json({ success: true, record });
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