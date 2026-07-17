import { createFileRoute } from "@tanstack/react-router";
import { DocumentationManager } from "@/backend/docs/DocumentationManager.server";

export const Route = createFileRoute("/api/docs/$tenantId/$docId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const doc = await DocumentationManager.getDocumentation(params.docId, params.tenantId);
        if (!doc) return Response.json({ error: "Documentation not found" }, { status: 404 });
        return Response.json({ documentation: doc });
      },
    },
  },
});