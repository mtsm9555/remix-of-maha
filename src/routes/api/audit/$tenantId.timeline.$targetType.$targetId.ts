import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/timeline/$targetType/$targetId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? 100);
        const { AuditQueryEngine } = await import("@/backend/security/audit/AuditQueryEngine.server");
        const timeline = await AuditQueryEngine.getResourceTimeline(params.tenantId, params.targetType, params.targetId, limit);
        return Response.json({ timeline });
      },
    },
  },
});
