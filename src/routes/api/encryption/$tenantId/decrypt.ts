import { createFileRoute } from "@tanstack/react-router";
import { FieldEncryptionManager } from "@/backend/security/encryption/FieldEncryptionManager.server";

export const Route = createFileRoute("/api/encryption/$tenantId/decrypt")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json();
        const plaintext = await FieldEncryptionManager.decryptField(
          params.tenantId, body.tableName, body.fieldName, body.encrypted, body.userId,
        );
        return Response.json({ plaintext });
      },
    },
  },
});