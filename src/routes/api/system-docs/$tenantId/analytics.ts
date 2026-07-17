import { createFileRoute } from "@tanstack/react-router";
import { SystemDocumentationManager } from "@/backend/docs/system/DocumentationManager.server";

export const Route = createFileRoute("/api/system-docs/$tenantId/analytics")({
  server: {
    handlers: {
      GET: async ({ params }) => Response.json(await SystemDocumentationManager.getAnalytics(params.tenantId)),
    },
  },
});