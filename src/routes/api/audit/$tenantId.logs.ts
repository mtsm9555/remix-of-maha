import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/logs")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = (await request.json()) as Record<string, unknown>;
        const { AuditQueryEngine } = await import("@/backend/security/audit/AuditQueryEngine.server");
        const query: any = { ...body, tenantId: params.tenantId };
        if (query.startTime) query.startTime = new Date(query.startTime);
        if (query.endTime) query.endTime = new Date(query.endTime);
        const result = await AuditQueryEngine.queryLogs(query);
        return Response.json(result);
      },
    },
  },
});
