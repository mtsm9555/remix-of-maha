import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/policies/seed")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { ApprovalPolicyManager } = await import("@/backend/security/approval/ApprovalPolicyManager.server");
        await ApprovalPolicyManager.seedDefaultPolicies(params.tenantId);
        return Response.json({ ok: true });
      },
    },
  },
});