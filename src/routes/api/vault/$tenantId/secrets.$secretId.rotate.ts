import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/vault/$tenantId/secrets/$secretId/rotate")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { userId: string; newValue?: string; reason?: 'manual' | 'compromised' };
        const { SecretsManager } = await import("@/backend/security/vault/SecretsManager.server");
        const secret = await SecretsManager.rotateSecret(params.secretId, body.userId, body.reason ?? 'manual', body.newValue);
        return Response.json({ ...secret, encryptedValue: undefined });
      },
    },
  },
});