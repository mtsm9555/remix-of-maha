import { createFileRoute } from "@tanstack/react-router";
import { SystemDocumentationManager } from "@/backend/docs/system/DocumentationManager.server";

export const Route = createFileRoute("/api/system-docs/$tenantId/$docId/feedback")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { userId, helpful } = await request.json();
        await SystemDocumentationManager.submitFeedback(params.docId, params.tenantId, userId, !!helpful);
        return Response.json({ ok: true });
      },
    },
  },
});