import { createFileRoute } from "@tanstack/react-router";
import { SystemDocumentationManager } from "@/backend/docs/system/DocumentationManager.server";

export const Route = createFileRoute("/api/system-docs/$tenantId/")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const docs = await SystemDocumentationManager.getAllDocumentation(params.tenantId, {
          category: url.searchParams.get("category") ?? undefined,
          status: url.searchParams.get("status") ?? undefined,
          limit: Number(url.searchParams.get("limit") ?? 50),
        });
        return Response.json({ documentation: docs });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const doc = await SystemDocumentationManager.createDocumentation(params.tenantId, body);
        return Response.json({ documentation: doc });
      },
    },
  },
});