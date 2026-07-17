import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/users/$userId/activity")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const days = Number(url.searchParams.get("days") ?? 30);
        const { AuditQueryEngine } = await import("@/backend/security/audit/AuditQueryEngine.server");
        const activity = await AuditQueryEngine.getUserActivity(params.tenantId, params.userId, days);
        return Response.json({ activity });
      },
    },
  },
});
