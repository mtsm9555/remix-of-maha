import { createFileRoute } from "@tanstack/react-router";
import { WebhookHandler } from "@/backend/cicd/WebhookHandler.server";

export const Route = createFileRoute("/api/public/cicd/webhooks/github/$tenantId")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const signature = request.headers.get("x-hub-signature-256") ?? "";
        const rawBody = await request.text();
        try {
          const result = await WebhookHandler.handleGitHub(rawBody, signature, params.tenantId);
          return Response.json(result);
        } catch (e) {
          return new Response((e as Error).message, { status: 401 });
        }
      },
    },
  },
});