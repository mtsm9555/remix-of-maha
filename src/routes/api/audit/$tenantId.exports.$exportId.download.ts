import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/exports/$exportId/download")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const by = url.searchParams.get("by") ?? "system";
        const { AuditExportManager } = await import("@/backend/security/audit/AuditExportManager.server");
        try {
          const { content, format } = await AuditExportManager.downloadExport(params.exportId, params.tenantId, by);
          const contentType = format === "json" ? "application/json" : format === "csv" ? "text/csv" : "application/octet-stream";
          return new Response(content, {
            headers: {
              "Content-Type": contentType,
              "Content-Disposition": `attachment; filename="audit_${params.exportId}.${format}"`,
            },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
