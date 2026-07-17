import { createFileRoute } from "@tanstack/react-router";
import { DocumentationManager } from "@/backend/docs/DocumentationManager.server";
import { CodeExampleGenerator } from "@/backend/docs/CodeExampleGenerator";

export const Route = createFileRoute("/api/docs/$tenantId/$docId/examples")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { endpointId, baseUrl, authToken } = await request.json();
        const doc = await DocumentationManager.getDocumentation(params.docId, params.tenantId);
        if (!doc) return Response.json({ error: "Documentation not found" }, { status: 404 });
        const endpoint = doc.endpoints.find(e => e.id === endpointId);
        if (!endpoint) return Response.json({ error: "Endpoint not found" }, { status: 404 });
        const examples = CodeExampleGenerator.generateExamples(endpoint, baseUrl, authToken);
        return Response.json({ examples });
      },
    },
  },
});