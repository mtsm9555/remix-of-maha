import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/policies")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const workspaceId = url.searchParams.get("workspaceId") || undefined;
        const { ApprovalPolicyManager } = await import("@/backend/security/approval/ApprovalPolicyManager.server");
        const policies = await ApprovalPolicyManager.getPolicies(params.tenantId, workspaceId);
        return Response.json({ policies });
      },
      POST: async ({ params, request }) => {
        const body = (await request.json()) as any;
        const { ApprovalPolicyManager } = await import("@/backend/security/approval/ApprovalPolicyManager.server");
        const policy = await ApprovalPolicyManager.createPolicy(params.tenantId, body.action, body);
        return Response.json({ policy });
      },
    },
  },
});