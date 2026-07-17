import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/vault/$tenantId/secrets/$secretId/reveal")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { userId: string };
        const ip = request.headers.get('x-forwarded-for') ?? undefined;
        const { SecretAccessController } = await import("@/backend/security/vault/SecretAccessController.server");
        const { SecretsManager } = await import("@/backend/security/vault/SecretsManager.server");
        const check = await SecretAccessController.canAccess(params.secretId, body.userId, params.tenantId, ip);
        if (!check.allowed) return Response.json(check, { status: 403 });
        const decrypted = await SecretsManager.revealSecret(params.secretId, params.tenantId, body.userId, ip);
        return Response.json(decrypted);
      },
    },
  },
});