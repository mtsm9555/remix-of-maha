import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/policies/$policyId")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const body = (await request.json()) as any;
        const { ApprovalPolicyManager } = await import("@/backend/security/approval/ApprovalPolicyManager.server");
        const policy = await ApprovalPolicyManager.updatePolicy(params.policyId, body);
        return Response.json({ policy });
      },
      DELETE: async ({ params }) => {
        const { ApprovalPolicyManager } = await import("@/backend/security/approval/ApprovalPolicyManager.server");
        await ApprovalPolicyManager.deletePolicy(params.policyId);
        return Response.json({ ok: true });
      },
    },
  },
});