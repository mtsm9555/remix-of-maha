import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/exports")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { AuditExportManager } = await import("@/backend/security/audit/AuditExportManager.server");
        return Response.json({ exports: await AuditExportManager.getExports(params.tenantId) });
      },
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { query: Record<string, unknown>; format: "csv" | "json" | "pdf"; requestedBy?: string };
        const { AuditExportManager } = await import("@/backend/security/audit/AuditExportManager.server");
        const query: any = { ...body.query, tenantId: params.tenantId };
        if (query.startTime) query.startTime = new Date(query.startTime);
        if (query.endTime) query.endTime = new Date(query.endTime);
        const exp = await AuditExportManager.createExport(params.tenantId, query, body.format, body.requestedBy ?? "system");
        return Response.json({ success: true, export: exp });
      },
    },
  },
});
