import { createFileRoute } from "@tanstack/react-router";
import { EncryptionAuditLogger } from "@/backend/security/encryption/EncryptionAuditLogger.server";

export const Route = createFileRoute("/api/encryption/$tenantId/audit")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const logs = await EncryptionAuditLogger.getAuditLogs(params.tenantId, {
          action: url.searchParams.get('action') || undefined,
          tableName: url.searchParams.get('tableName') || undefined,
          fieldName: url.searchParams.get('fieldName') || undefined,
          limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
        });
        return Response.json({ logs });
      },
    },
  },
});