import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/retention/tick")({
  server: {
    handlers: {
      POST: async () => {
        const { AuditRetentionManager } = await import("@/backend/security/audit/AuditRetentionManager.server");
        const { AuditExportManager } = await import("@/backend/security/audit/AuditExportManager.server");
        await AuditRetentionManager.cleanupAllTenants();
        const cleaned = await AuditExportManager.cleanupExpiredExports();
        return Response.json({ success: true, expiredExportsCleaned: cleaned });
      },
    },
  },
});
