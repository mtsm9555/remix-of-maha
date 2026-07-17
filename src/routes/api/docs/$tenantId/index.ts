import { createFileRoute } from "@tanstack/react-router";
import { DocumentationManager } from "@/backend/docs/DocumentationManager.server";

export const Route = createFileRoute("/api/docs/$tenantId/")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const documentation = await DocumentationManager.getAllDocumentation(params.tenantId);
        return Response.json({ documentation });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const doc = await DocumentationManager.createDocumentation(params.tenantId, body);
        return Response.json({ documentation: doc });
      },
    },
  },
});