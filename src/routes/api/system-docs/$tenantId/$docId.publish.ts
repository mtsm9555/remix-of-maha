import { createFileRoute } from "@tanstack/react-router";
import { SystemDocumentationManager } from "@/backend/docs/system/DocumentationManager.server";

export const Route = createFileRoute("/api/system-docs/$tenantId/$docId/publish")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { publishedBy } = await request.json();
        const doc = await SystemDocumentationManager.publishDocumentation(params.docId, params.tenantId, publishedBy ?? "system");
        if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json({ documentation: doc });
      },
    },
  },
});