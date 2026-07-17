import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/retention")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { AuditRetentionManager } = await import("@/backend/security/audit/AuditRetentionManager.server");
        return Response.json({ retention: await AuditRetentionManager.getRetention(params.tenantId) });
      },
      PUT: async ({ params, request }) => {
        const body = (await request.json()) as { retentionDays?: number; archiveAfterDays?: number };
        const { AuditRetentionManager } = await import("@/backend/security/audit/AuditRetentionManager.server");
        await AuditRetentionManager.updateRetention(params.tenantId, body);
        return Response.json({ success: true });
      },
    },
  },
});
