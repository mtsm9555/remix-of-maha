import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/requests/history/$userId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") || "50");
        const { ApprovalRequestEngine } = await import("@/backend/security/approval/ApprovalRequestEngine.server");
        const requests = await ApprovalRequestEngine.getRequestHistory(params.userId, params.tenantId, limit);
        return Response.json({ requests });
      },
    },
  },
});