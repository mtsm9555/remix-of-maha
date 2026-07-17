import { createFileRoute } from "@tanstack/react-router";
import { EncryptionKeyManager } from "@/backend/security/encryption/EncryptionKeyManager.server";

export const Route = createFileRoute("/api/encryption/$tenantId/keys/$keyId/revoke")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json().catch(() => ({}));
        await EncryptionKeyManager.revokeKey(params.keyId, params.tenantId, body.revokedBy || 'system', body.reason || 'manual');
        return Response.json({ success: true });
      },
    },
  },
});