import { createFileRoute } from "@tanstack/react-router";
import { DocumentationManager } from "@/backend/docs/DocumentationManager.server";

export const Route = createFileRoute("/api/docs/$tenantId/$docId/markdown")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const md = await DocumentationManager.exportMarkdown(params.docId, params.tenantId);
          return new Response(md, {
            headers: {
              "Content-Type": "text/markdown",
              "Content-Disposition": 'attachment; filename="documentation.md"',
            },
          });
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 404 });
        }
      },
    },
  },
});