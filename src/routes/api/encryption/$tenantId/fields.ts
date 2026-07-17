import { createFileRoute } from "@tanstack/react-router";
import { FieldEncryptionManager } from "@/backend/security/encryption/FieldEncryptionManager.server";

export const Route = createFileRoute("/api/encryption/$tenantId/fields")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const fields = await FieldEncryptionManager.getConfiguredFields(params.tenantId);
        return Response.json({ fields });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const field = await FieldEncryptionManager.configureField(
          params.tenantId,
          body.tableName,
          body.fieldName,
          body.classification,
          body.encryptionKeyId,
          { description: body.description, requiresAudit: body.requiresAudit, algorithm: body.algorithm },
        );
        return Response.json({ field });
      },
    },
  },
});