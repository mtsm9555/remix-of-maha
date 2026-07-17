import { createFileRoute } from "@tanstack/react-router";
import { EncryptionKeyManager } from "@/backend/security/encryption/EncryptionKeyManager.server";

export const Route = createFileRoute("/api/encryption/$tenantId/keys")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const keys = await EncryptionKeyManager.getKeys(params.tenantId);
        return Response.json({ keys });
      },
      POST: async ({ params, request }) => {
        const body = await request.json();
        const key = await EncryptionKeyManager.createKey(
          params.tenantId,
          body.name,
          body.type,
          body.algorithm,
          {
            description: body.description,
            rotationEnabled: body.rotationEnabled,
            rotationIntervalDays: body.rotationIntervalDays,
            allowedServices: body.allowedServices,
            allowedRoles: body.allowedRoles,
            createdBy: body.createdBy || 'system',
          },
        );
        return Response.json({ key });
      },
    },
  },
});