import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/requests/pending/$approverId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { ApprovalRequestEngine } = await import("@/backend/security/approval/ApprovalRequestEngine.server");
        const requests = await ApprovalRequestEngine.getPendingRequests(params.approverId, params.tenantId);
        return Response.json({ requests });
      },
    },
  },
});