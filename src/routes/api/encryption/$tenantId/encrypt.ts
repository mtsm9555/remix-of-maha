import { createFileRoute } from "@tanstack/react-router";
import { FieldEncryptionManager } from "@/backend/security/encryption/FieldEncryptionManager.server";

export const Route = createFileRoute("/api/encryption/$tenantId/encrypt")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json();
        const encrypted = await FieldEncryptionManager.encryptField(
          params.tenantId, body.tableName, body.fieldName, body.plaintext, body.userId,
        );
        return Response.json({ encrypted });
      },
    },
  },
});