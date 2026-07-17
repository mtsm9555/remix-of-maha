import { createFileRoute } from "@tanstack/react-router";
import { DocumentationManager } from "@/backend/docs/DocumentationManager.server";

export const Route = createFileRoute("/api/docs/$tenantId/$docId/openapi-json")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const json = await DocumentationManager.exportOpenAPIJSON(params.docId, params.tenantId);
          return new Response(json, {
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition": 'attachment; filename="openapi.json"',
            },
          });
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 404 });
        }
      },
    },
  },
});