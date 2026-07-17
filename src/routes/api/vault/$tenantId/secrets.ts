import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/vault/$tenantId/secrets")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { SecretsManager } = await import("@/backend/security/vault/SecretsManager.server");
        const secrets = await SecretsManager.listSecrets(params.tenantId);
        return Response.json(secrets.map((s) => ({ ...s, encryptedValue: undefined })));
      },
      POST: async ({ params, request }) => {
        const body = (await request.json()) as {
          name: string; value: string; createdBy: string;
          description?: string; type?: string; tags?: string[];
          rotationEnabled?: boolean; rotationIntervalDays?: number;
          expiresAt?: string; workspaceId?: string;
        };
        const { SecretsManager } = await import("@/backend/security/vault/SecretsManager.server");
        const secret = await SecretsManager.createSecret(params.tenantId, body.name, body.value, {
          createdBy: body.createdBy,
          description: body.description,
          type: body.type as never,
          tags: body.tags,
          rotationEnabled: body.rotationEnabled,
          rotationIntervalDays: body.rotationIntervalDays,
          expiresAt: body.expiresAt,
          workspaceId: body.workspaceId,
        });
        return Response.json({ ...secret, encryptedValue: undefined });
      },
    },
  },
});