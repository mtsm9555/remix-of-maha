import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/requests/$requestId/decision")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { approverId: string; decision: "approved" | "rejected"; comments?: string };
        const { ApprovalRequestEngine } = await import("@/backend/security/approval/ApprovalRequestEngine.server");
        const req = await ApprovalRequestEngine.submitDecision(params.requestId, body.approverId, body.decision, body.comments);
        return Response.json({ request: req });
      },
    },
  },
});