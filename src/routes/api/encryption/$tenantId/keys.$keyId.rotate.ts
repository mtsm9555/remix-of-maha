import { createFileRoute } from "@tanstack/react-router";
import { EncryptionKeyManager } from "@/backend/security/encryption/EncryptionKeyManager.server";

export const Route = createFileRoute("/api/encryption/$tenantId/keys/$keyId/rotate")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json().catch(() => ({}));
        const key = await EncryptionKeyManager.rotateKey(
          params.keyId,
          params.tenantId,
          body.rotatedBy || 'system',
          body.reason || 'manual',
        );
        return Response.json({ key });
      },
    },
  },
});