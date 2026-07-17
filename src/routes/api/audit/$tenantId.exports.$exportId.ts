import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/exports/$exportId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { AuditExportManager } = await import("@/backend/security/audit/AuditExportManager.server");
        const exp = await AuditExportManager.getExportStatus(params.exportId, params.tenantId);
        if (!exp) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        return Response.json({ export: exp });
      },
    },
  },
});
