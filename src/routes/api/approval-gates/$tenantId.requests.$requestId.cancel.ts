import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/requests/$requestId/cancel")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { cancelledBy: string };
        const { ApprovalRequestEngine } = await import("@/backend/security/approval/ApprovalRequestEngine.server");
        await ApprovalRequestEngine.cancelRequest(params.requestId, body.cancelledBy);
        return Response.json({ ok: true });
      },
    },
  },
});