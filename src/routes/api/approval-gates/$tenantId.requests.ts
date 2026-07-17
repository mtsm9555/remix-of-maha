import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/requests")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as any;
        const { ApprovalRequestEngine } = await import("@/backend/security/approval/ApprovalRequestEngine.server");
        const req = await ApprovalRequestEngine.createRequest(
          params.tenantId,
          body.action,
          body.requestedBy,
          body.requestData || {},
          body.justification || "",
          body.options || {}
        );
        return Response.json({ request: req });
      },
    },
  },
});