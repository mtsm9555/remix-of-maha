import { createFileRoute } from "@tanstack/react-router";
import { SystemDocumentationManager } from "@/backend/docs/system/DocumentationManager.server";

export const Route = createFileRoute("/api/system-docs/$tenantId/$docId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const doc = await SystemDocumentationManager.getDocumentation(params.docId, params.tenantId);
        if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json({ documentation: doc });
      },
      PATCH: async ({ params, request }) => {
        const body = await request.json();
        const doc = await SystemDocumentationManager.updateDocumentation(params.docId, params.tenantId, body);
        if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json({ documentation: doc });
      },
      DELETE: async ({ params }) => {
        await SystemDocumentationManager.deleteDocumentation(params.docId, params.tenantId);
        return Response.json({ ok: true });
      },
    },
  },
});