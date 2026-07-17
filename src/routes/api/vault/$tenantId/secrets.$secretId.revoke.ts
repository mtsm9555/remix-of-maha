import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/vault/$tenantId/secrets/$secretId/revoke")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { userId: string };
        const { SecretsManager } = await import("@/backend/security/vault/SecretsManager.server");
        await SecretsManager.revokeSecret(params.secretId, params.tenantId, body.userId);
        return Response.json({ success: true });
      },
    },
  },
});