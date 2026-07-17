import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/expire/tick")({
  server: {
    handlers: {
      POST: async () => {
        const { ApprovalRequestEngine } = await import("@/backend/security/approval/ApprovalRequestEngine.server");
        const expired = await ApprovalRequestEngine.expireOldRequests();
        return Response.json({ expired });
      },
    },
  },
});