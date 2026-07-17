import { createFileRoute } from "@tanstack/react-router";
import { DocumentationManager } from "@/backend/docs/DocumentationManager.server";

export const Route = createFileRoute("/api/docs/$tenantId/$docId/versions")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const versions = await DocumentationManager.getVersionHistory(params.docId, params.tenantId);
        return Response.json({ versions });
      },
    },
  },
});