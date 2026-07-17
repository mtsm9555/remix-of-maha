import { createFileRoute } from "@tanstack/react-router";
import { DocumentationManager } from "@/backend/docs/DocumentationManager.server";

export const Route = createFileRoute("/api/docs/$tenantId/$docId/openapi-yaml")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const yaml = await DocumentationManager.exportOpenAPIYAML(params.docId, params.tenantId);
          return new Response(yaml, {
            headers: {
              "Content-Type": "application/x-yaml",
              "Content-Disposition": 'attachment; filename="openapi.yaml"',
            },
          });
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 404 });
        }
      },
    },
  },
});